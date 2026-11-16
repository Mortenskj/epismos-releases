(() => {
  const routes = new Map([
    ['#install-chatgpt', '#chatgpt-plugin'],
    ['#install-claude', '#claude-plugin'],
    ['#install-codex', '#chatgpt-plugin'],
    ['#install-gemini', '#gemini-plugin'],
  ]);
  function redirect() {
    const section = location.hash;
    if (section && section !== '#installation' && !routes.has(section)) return;

    const destination = new URL('https://instruct.epismos.com/');
    destination.hash = routes.get(section) || '';
    destination.searchParams.set('lang', document.documentElement.lang);
    const theme = new URLSearchParams(location.search).get('theme');
    if (theme === 'light' || theme === 'dark') destination.searchParams.set('theme', theme);
    if (section === '#install-codex') destination.searchParams.set('client', 'codex');
    location.replace(destination.href);
  }
  addEventListener('hashchange', redirect);
  redirect();
})();
