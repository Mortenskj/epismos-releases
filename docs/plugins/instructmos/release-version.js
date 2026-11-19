(() => {
  if (!/^https?:$/.test(location.protocol)) return;
  const pointer = 'https://raw.githubusercontent.com/Mortenskj/epismos-releases/main/docs/plugins/instructmos/latest.json';
  const repo = 'https://github.com/Mortenskj/epismos-releases';
  fetch(pointer, { cache: 'no-cache', credentials: 'omit', referrerPolicy: 'no-referrer' })
    .then(response => response.ok ? response.json() : null)
    .then(release => {
      const version = release?.version;
      if (typeof version !== 'string' || version.trim() !== version ||
          !/^(0|[1-9][0-9]{0,5})(\.(0|[1-9][0-9]{0,5})){2}$/.test(version)) return;
      const tag = 'instructmos-v' + version;
      const urls = {
        zip: repo + '/releases/download/' + tag + '/instructmos-' + version + '.zip',
        release: repo + '/releases/tag/' + tag,
        source: repo + '/tree/' + tag + '/plugins/instructmos'
      };
      document.querySelectorAll('[data-instructmos-release]').forEach(control => {
        const url = urls[control.dataset.instructmosRelease];
        if (url) control.href = url;
        const label = control.textContent.replace(/\b\d+\.\d+\.\d+\b/, version);
        if (label !== control.textContent) control.textContent = label;
      });
    })
    .catch(() => { /* Keep the bundled release links if the lookup fails. */ });
})();
