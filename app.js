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

  function normalizePrivateCode(value) {
    const text = String(value || '').trim();
    const match = text.match(/[?&]code=([A-Za-z0-9]+)/i);
    return match ? match[1] : text.replace(/[^A-Za-z0-9]/g, '');
  }

  function parseInviteLikeInput(value) {
    const text = String(value || '').trim();
    if (!text) return null;
    try {
      const url = new URL(text);
      const params = url.searchParams;
      return {
        placeId: normalizePlaceId(params.get('placeId')),
        instanceId: normalizeInstanceId(params.get('gameInstanceId') || params.get('jobId')),
        privateCode: normalizePrivateCode(params.get('privateCode') || params.get('linkCode') || params.get('privateServerCode') || params.get('privateServerLink') || params.get('code'))
      };
    } catch (_) {
      return null;
    }
  }

  function buildDeepLink(placeId, instanceId) {
    return 'roblox://placeId=' + encodeURIComponent(placeId) + '&gameInstanceId=' + encodeURIComponent(instanceId);
  }

  function buildPlaceLink(placeId) {
    return 'roblox://placeId=' + encodeURIComponent(placeId);
  }

  function buildPrivateLink(placeId, privateCode) {
    if (!privateCode) return '';
    return placeId
      ? 'roblox://placeId=' + encodeURIComponent(placeId) + '&linkCode=' + encodeURIComponent(privateCode)
      : 'roblox://navigation/share_links?code=' + encodeURIComponent(privateCode) + '&type=Server';
  }

  function buildWebLink(placeId, instanceId) {
    return 'https://www.roblox.com/games/' + encodeURIComponent(placeId) + '/?gameInstanceId=' + encodeURIComponent(instanceId);
  }

  function buildPlaceWebLink(placeId) {
    return 'https://www.roblox.com/games/' + encodeURIComponent(placeId) + '/';
  }

  function buildPrivateWebLink(privateCode) {
    return 'https://www.roblox.com/share?code=' + encodeURIComponent(privateCode) + '&type=Server';
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
    const params = getParams();
    const placeId = normalizePlaceId(params.get('placeId'));
    const instanceId = normalizeInstanceId(params.get('gameInstanceId') || params.get('jobId'));
    const privateCode = normalizePrivateCode(params.get('privateCode') || params.get('linkCode') || params.get('privateServerCode') || params.get('privateServerLink'));
    const mode = privateCode ? 'private' : 'public';
    const jobValue = byId('job-id');
    const placeValue = byId('place-id');
    const placeLabel = byId('place-label');
    const jobLabel = byId('job-label');
    const openApp = byId('open-app');
    const openWeb = byId('open-web');
    const description = byId('invite-description');
    const deepLink = mode === 'private'
      ? buildPrivateLink(placeId, privateCode)
      : instanceId
        ? buildDeepLink(placeId, instanceId)
        : buildPlaceLink(placeId);
    const webLink = mode === 'private'
      ? buildPrivateWebLink(privateCode)
      : instanceId
        ? buildWebLink(placeId, instanceId)
        : buildPlaceWebLink(placeId);

    if (!placeId && mode !== 'private') {
      window.location.replace('../menu/' + window.location.search + window.location.hash);
      return;
    }

    if (mode === 'private' && !privateCode) {
      window.location.replace('../menu/' + window.location.search + window.location.hash);
      return;
    }

    if (placeLabel) {
      placeLabel.textContent = mode === 'private' ? 'Private Server' : 'Place ID';
    }
    if (placeValue) {
      placeValue.textContent = mode === 'private' ? 'Share-code join' : placeId;
    }
    if (openWeb) openWeb.href = webLink;
    if (description) {
      description.textContent = mode === 'private'
        ? 'Tap the button below to open Roblox for this private server. If the app does not launch, use the fallback web button.'
        : instanceId
          ? 'Tap the button below to open the Roblox app for this exact server on desktop or mobile. If Roblox does not launch, use the fallback web button.'
          : 'Tap the button below to open Roblox for this place. If Roblox does not launch, use the fallback web button.';
    }
    if (jobLabel) {
      jobLabel.textContent = mode === 'private'
        ? 'Private Server Code'
        : instanceId
          ? 'Server Job ID'
          : 'Join Type';
    }
    if (jobValue) {
      jobValue.textContent = mode === 'private'
        ? privateCode
        : instanceId || 'Public place join';
    }

    function openRoblox() {
      window.location.href = deepLink;
    }

    openApp && openApp.addEventListener('click', openRoblox);

    setStatus('Trying Roblox app first. If nothing opens, use the buttons above.');
    window.setTimeout(openRoblox, 250);
  }

  function initMenuPage() {
    const modeInputs = document.querySelectorAll('input[name="joinType"]');
    const placeField = byId('place-field');
    const placeInput = byId('placeId');
    const instanceInput = byId('gameInstanceId');
    const inviteLinkInput = byId('inviteLink');
    const privateInput = byId('privateCode');
    const publicFields = byId('public-fields');
    const privateFields = byId('private-fields');
    const launchButton = byId('launch-invite');
    const viewGameButton = byId('view-game');
    const copyLinkButton = byId('copy-link');
    const output = byId('generated-link');

    function getMode() {
      const checked = document.querySelector('input[name="joinType"]:checked');
      return checked ? checked.value : 'public';
    }

    function makeUrl() {
      const mode = getMode();
      const placeId = normalizePlaceId(placeInput && placeInput.value);
      const instanceId = normalizeInstanceId(instanceInput && instanceInput.value);
      const privateCode = normalizePrivateCode(privateInput && privateInput.value);
      const url = new URL('../invite/', window.location.href);
      if (mode === 'private') {
        if (!privateCode) return '';
        if (placeId) {
          url.searchParams.set('placeId', placeId);
        }
        url.searchParams.set('privateCode', privateCode);
        return url.toString();
      }
      if (!placeId) return '';
      url.searchParams.set('placeId', placeId);
      if (instanceId) {
        url.searchParams.set('gameInstanceId', instanceId);
      }
      return url.toString();
    }

    function makeViewUrl() {
      const mode = getMode();
      const placeId = normalizePlaceId(placeInput && placeInput.value);
      const instanceId = normalizeInstanceId(instanceInput && instanceInput.value);
      const privateCode = normalizePrivateCode(privateInput && privateInput.value);
      if (mode === 'private') {
        return privateCode ? buildPrivateWebLink(privateCode) : '';
      }
      if (!placeId) return '';
      return instanceId ? buildWebLink(placeId, instanceId) : buildPlaceWebLink(placeId);
    }

    function syncModeUi() {
      const mode = getMode();
      if (placeField) placeField.classList.toggle('hidden', mode === 'private');
      if (publicFields) publicFields.classList.toggle('hidden', mode !== 'public');
      if (privateFields) privateFields.classList.toggle('hidden', mode !== 'private');
    }

    function absorbInviteLink() {
      const parsed = parseInviteLikeInput(inviteLinkInput && inviteLinkInput.value);
      if (!parsed) return;
      if (parsed.privateCode) {
        const privateRadio = document.querySelector('input[name="joinType"][value="private"]');
        if (privateRadio) privateRadio.checked = true;
        if (privateInput) privateInput.value = parsed.privateCode;
        if (placeInput && parsed.placeId) placeInput.value = parsed.placeId;
        return;
      }
      if (parsed.placeId || parsed.instanceId) {
        const publicRadio = document.querySelector('input[name="joinType"][value="public"]');
        if (publicRadio) publicRadio.checked = true;
        if (placeInput && parsed.placeId) placeInput.value = parsed.placeId;
        if (instanceInput && parsed.instanceId) instanceInput.value = parsed.instanceId;
      }
    }

    function refresh() {
      absorbInviteLink();
      syncModeUi();
      const mode = getMode();
      const url = makeUrl();
      const viewUrl = makeViewUrl();
      output.textContent = url || 'Fill in the required fields to generate a join link.';
      if (launchButton) launchButton.disabled = !url;
      if (viewGameButton) viewGameButton.disabled = !viewUrl;
      if (copyLinkButton) copyLinkButton.disabled = !url;
      setStatus(
        url
          ? 'Join link ready.'
          : mode === 'private'
            ? 'Enter a private server code or share link. Place ID is optional.'
            : 'Enter a place ID. Game instance ID is optional for public joins.'
      );
    }

    modeInputs.forEach(function (input) {
      input.addEventListener('change', refresh);
    });
    inviteLinkInput && inviteLinkInput.addEventListener('input', refresh);
    placeInput && placeInput.addEventListener('input', refresh);
    instanceInput && instanceInput.addEventListener('input', refresh);
    privateInput && privateInput.addEventListener('input', refresh);

    launchButton && launchButton.addEventListener('click', function () {
      const url = makeUrl();
      if (url) window.location.href = url;
    });

    viewGameButton && viewGameButton.addEventListener('click', function () {
      const viewUrl = makeViewUrl();
      if (viewUrl) {
        window.open(viewUrl, '_blank', 'noopener');
      }
    });

    copyLinkButton && copyLinkButton.addEventListener('click', function () {
      const url = makeUrl();
      if (url) copyText(url, 'Join link copied.');
    });

    refresh();
  }

  if (document.body.dataset.page === 'invite') initInvitePage();
  if (document.body.dataset.page === 'menu') initMenuPage();
})();