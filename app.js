(function () {
  function byId(id) {
    return document.getElementById(id);
  }

  function setStatus(message, type) {
    const el = byId('status');
    if (!el) return;
    el.textContent = message;
    el.className = 'small status' + (type ? ' ' + type : '');
  }

  function getParams() {
    return new URLSearchParams(window.location.search);
  }

  function normalizePlaceId(value) {
    const text = String(value || '').trim();
    return /^\d+$/.test(text) ? text : '';
  }

  function normalizeInstanceId(value) {
    return String(value || '').trim();
  }

  function buildDeepLink(placeId, instanceId) {
    return 'roblox://placeId=' + encodeURIComponent(placeId) + '&gameInstanceId=' + encodeURIComponent(instanceId);
  }

  function buildWebLink(placeId, instanceId) {
    return 'https://www.roblox.com/games/' + encodeURIComponent(placeId) + '/?gameInstanceId=' + encodeURIComponent(instanceId);
  }

  async function copyText(text, successLabel) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const temp = document.createElement('textarea');
        temp.value = text;
        document.body.appendChild(temp);
        temp.select();
        document.execCommand('copy');
        document.body.removeChild(temp);
      }
      setStatus(successLabel || 'Copied.', 'ok');
      return true;
    } catch (error) {
      setStatus('Could not copy automatically.', 'error');
      return false;
    }
  }

  function initInvitePage() {
    const placeId = normalizePlaceId(getParams().get('placeId'));
    const instanceId = normalizeInstanceId(getParams().get('gameInstanceId') || getParams().get('jobId'));
    const jobValue = byId('job-id');
    const placeValue = byId('place-id');
    const openApp = byId('open-app');
    const copyJob = byId('copy-job');
    const openWeb = byId('open-web');
    const missingState = byId('missing-state');
    const readyState = byId('ready-state');
    const deepLink = placeId && instanceId ? buildDeepLink(placeId, instanceId) : '';
    const webLink = placeId && instanceId ? buildWebLink(placeId, instanceId) : '';

    if (!placeId || !instanceId) {
      if (missingState) missingState.hidden = false;
      if (readyState) readyState.hidden = true;
      setStatus('Missing placeId or gameInstanceId in the URL.', 'error');
      return;
    }

    if (jobValue) jobValue.textContent = instanceId;
    if (placeValue) placeValue.textContent = placeId;
    if (openWeb) openWeb.href = webLink;

    function openRoblox() {
      window.location.href = deepLink;
    }

    openApp && openApp.addEventListener('click', openRoblox);
    copyJob && copyJob.addEventListener('click', function () {
      copyText(instanceId, 'Job ID copied.');
    });

    setStatus('Trying Roblox app first. If nothing opens, use the buttons above.');
    window.setTimeout(openRoblox, 250);
  }

  function initMenuPage() {
    const placeInput = byId('placeId');
    const instanceInput = byId('gameInstanceId');
    const launchButton = byId('launch-invite');
    const copyLinkButton = byId('copy-link');
    const output = byId('generated-link');

    function makeUrl() {
      const placeId = normalizePlaceId(placeInput && placeInput.value);
      const instanceId = normalizeInstanceId(instanceInput && instanceInput.value);
      if (!placeId || !instanceId) return '';
      const url = new URL('../invite/', window.location.href);
      url.searchParams.set('placeId', placeId);
      url.searchParams.set('gameInstanceId', instanceId);
      return url.toString();
    }

    function refresh() {
      const url = makeUrl();
      output.textContent = url || 'Fill in both fields to generate an invite link.';
      if (launchButton) launchButton.disabled = !url;
      if (copyLinkButton) copyLinkButton.disabled = !url;
      setStatus(url ? 'Invite link ready.' : 'Enter a place ID and a game instance ID.');
    }

    placeInput && placeInput.addEventListener('input', refresh);
    instanceInput && instanceInput.addEventListener('input', refresh);

    launchButton && launchButton.addEventListener('click', function () {
      const url = makeUrl();
      if (url) window.location.href = url;
    });

    copyLinkButton && copyLinkButton.addEventListener('click', function () {
      const url = makeUrl();
      if (url) copyText(url, 'Invite link copied.');
    });

    refresh();
  }

  if (document.body.dataset.page === 'invite') initInvitePage();
  if (document.body.dataset.page === 'menu') initMenuPage();
})();