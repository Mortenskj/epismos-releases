const copy = document.body.dataset;
const languageLink = document.querySelector('.language');
const languageURL = new URL(languageLink.href);
function preserveSection() {
  languageURL.hash = location.hash;
  languageLink.href = languageURL.href;
}
addEventListener('hashchange', preserveSection);
preserveSection();

const expected = document.getElementById('expected');
const pasted = document.getElementById('pasted');
const result = document.querySelector('.result');
function updateExample() {
  const name = field => field.selectedOptions[0].text;
  const matches = expected.value === pasted.value;
  result.dataset.match = matches;
  result.querySelector('strong').textContent = matches ? copy.match : copy.mismatch;
  result.querySelector('p').textContent = matches
    ? copy.matchMessage
    : copy.mismatchMessage.replace('{pasted}', name(pasted)).replace('{expected}', name(expected));
}
expected.addEventListener('change', updateExample);
pasted.addEventListener('change', updateExample);

const install = document.querySelector('.install');
const picker = install.querySelector('.install-picker');
const clients = [...picker.querySelectorAll('button')];
const guides = clients.map(button => document.getElementById(button.getAttribute('aria-controls')));
const progress = install.querySelector('.install-progress');
const feedback = install.querySelector('.install-copy-feedback');
const footer = install.querySelector('.install-footer');
const previous = footer.querySelector('.install-prev');
const next = footer.querySelector('.install-next');
let client = 0;
let step = 0;
let view = 0;

function showInstallStep(focusHeading = false) {
  view += 1;
  feedback.textContent = '';
  guides.forEach((guide, index) => {
    guide.hidden = index !== client;
    clients[index].setAttribute('aria-pressed', String(index === client));
  });
  const steps = [...guides[client].querySelectorAll('li')];
  steps.forEach((item, index) => { item.hidden = index !== step; });
  progress.style.setProperty('--install-progress', (step + 1) / steps.length);
  progress.querySelector('.install-count').textContent = copy.stepLabel.replace('{step}', step + 1).replace('{total}', steps.length);
  previous.setAttribute('aria-disabled', String(step === 0));
  next.setAttribute('aria-disabled', String(step === steps.length - 1));
  if (focusHeading) {
    const heading = steps[step].querySelector('h4');
    heading.setAttribute('tabindex', '-1');
    heading.focus({preventScroll: true});
    heading.scrollIntoView({block: 'nearest'});
  }
}

clients.forEach((button, index) => button.addEventListener('click', () => {
  if (client === index) return;
  client = index;
  step = 0;
  showInstallStep();
}));

for (const [button, direction] of [[previous, -1], [next, 1]]) {
  button.addEventListener('click', () => {
    if (button.getAttribute('aria-disabled') === 'true') return;
    step += direction;
    showInstallStep(true);
  });
}

for (const command of install.querySelectorAll('.install-command')) {
  const button = command.querySelector('button');
  const code = command.querySelector('code');
  button.hidden = false;
  button.addEventListener('click', async () => {
    const copyView = view;
    feedback.textContent = '';
    try {
      await navigator.clipboard.writeText(code.textContent);
      if (copyView === view) feedback.textContent = copy.copySuccess;
    } catch {
      if (copyView !== view) return;
      const range = document.createRange();
      range.selectNodeContents(code);
      window.getSelection().removeAllRanges();
      window.getSelection().addRange(range);
      feedback.textContent = copy.copyFailure;
    }
  });
}

showInstallStep();
install.dataset.ready = '';
for (const control of [picker, progress, feedback, footer]) control.hidden = false;
