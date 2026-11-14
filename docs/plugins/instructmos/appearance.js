(() => {
  const root = document.documentElement;
  const linkedTheme = new URLSearchParams(location.search).get('theme');
  try {
    root.dataset.theme = localStorage.getItem('instructmos.plugin.theme') === 'light' ? 'light' : 'dark';
    root.dataset.motion = localStorage.getItem('instructmos.plugin.motion') === 'paused' ? 'paused' : 'active';
  } catch {
    root.dataset.theme = 'dark';
    root.dataset.motion = 'active';
  }
  if (linkedTheme === 'light' || linkedTheme === 'dark') root.dataset.theme = linkedTheme;
})();
