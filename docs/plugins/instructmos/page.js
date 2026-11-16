const copy = document.body.dataset;
const settings = document.querySelector('.site-settings');
const languageLink = document.querySelector('.language');
const languageURL = new URL(languageLink.href);
if (languageURL.protocol !== 'file:') languageURL.pathname = languageURL.pathname.replace(/index\.html$/, '');
function preserveSection() {
  languageURL.hash = location.hash;
  languageURL.searchParams.set('theme', document.documentElement.dataset.theme || 'dark');
  languageLink.href = languageURL.href;
}
addEventListener('hashchange', preserveSection);
preserveSection();
settings.addEventListener('keydown', event => {
  if (event.key !== 'Escape' || !settings.open) return;
  settings.open = false;
  settings.querySelector('summary').focus();
});
document.addEventListener('click', event => {
  if (!settings.contains(event.target)) settings.open = false;
});

const theme = document.getElementById('site-theme');
const motion = document.getElementById('site-motion');
const root = document.documentElement;
theme.value = root.dataset.theme || 'dark';
motion.checked = root.dataset.motion === 'paused';
settings.querySelector('.settings-enhancements').hidden = false;
theme.addEventListener('change', () => {
  root.dataset.theme = theme.value;
  const url = new URL(location.href);
  if (url.searchParams.has('theme')) {
    url.searchParams.set('theme', theme.value);
    history.replaceState(history.state, '', url);
  }
  preserveSection();
  try {
    localStorage.setItem('instructmos.plugin.theme', theme.value);
  } catch {
    // The theme still applies to this page.
  }
});
motion.addEventListener('change', () => {
  root.dataset.motion = motion.checked ? 'paused' : 'active';
  try {
    localStorage.setItem('instructmos.plugin.motion', root.dataset.motion);
  } catch {
    // The motion setting still applies to this page.
  }
});

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
  if (guides.some(guide => '#' + guide.id === location.hash)) {
    history.replaceState(history.state, '', '#' + guides[client].id);
    preserveSection();
  }
  showInstallStep();
}));

for (const [button, direction] of [[previous, -1], [next, 1]]) {
  button.addEventListener('click', () => {
    if (button.getAttribute('aria-disabled') === 'true') return;
    step += direction;
    showInstallStep(true);
  });
}

install.querySelector('.install-use')?.addEventListener('click', event => {
  event.preventDefault();
  step = 2;
  showInstallStep(true);
});

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

function openLinkedGuide(moveFocus) {
  const index = guides.findIndex(guide => '#' + guide.id === location.hash);
  if (index === -1) return;
  client = index;
  step = 0;
  showInstallStep();
  const title = document.getElementById('install-title');
  if (moveFocus) title.focus({preventScroll: true});
  title.closest('section').scrollIntoView();
}
addEventListener('hashchange', () => openLinkedGuide(true));
openLinkedGuide(false);
