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
    if (match) return match[1];
    const privateLinkCode = normalizePrivateLinkCode(text);
    return privateLinkCode || text.replace(/[^A-Za-z0-9]/g, '');
  }

  function normalizePrivateLinkCode(value) {
    const text = String(value || '').trim();
    const match = text.match(/[?&]privateServerLinkCode=([A-Za-z0-9]+)/i);
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
        privateCode: normalizePrivateCode(params.get('privateCode') || params.get('linkCode') || params.get('privateServerCode') || params.get('privateServerLink') || params.get('code') || params.get('privateServerLinkCode'))
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

  function buildShareLinkDeepLink(privateCode) {
    return 'roblox://navigation/share_links?code=' + encodeURIComponent(privateCode) + '&type=Server';
  }

  function buildCommunityIssueUrl(payload) {
    const url = new URL('https://github.com/Furry-Changed-Fox/furry-changed-fox.github.io/issues/new');
    url.searchParams.set('title', 'Community private server: ' + payload.gameName);
    url.searchParams.set('body', [
      '## Community Private Server Submission',
      '',
      '**Submitted by:** ' + payload.submitterLabel,
      '**Game name:** ' + payload.gameName,
      '**Category:** ' + payload.categoryLabel,
      '**Private server share link:** ' + payload.shareLink,
      '**Share code:** ' + payload.shareCode,
      payload.note ? '**Note:** ' + payload.note : '**Note:** (none)',
      '',
      '> This was submitted from the /ps community upload form and should only be added after review.'
    ].join('\n'));
    return url.toString();
  }

  function getDiscordAvatarUrl(user) {
    if (!user) return '';
    if (user.avatar) {
      return 'https://cdn.discordapp.com/avatars/' + user.id + '/' + user.avatar + '.png?size=128';
    }
    const discriminator = Number(user.discriminator || '0');
    const fallback = Number.isFinite(discriminator) ? discriminator % 5 : 0;
    return 'https://cdn.discordapp.com/embed/avatars/' + fallback + '.png';
  }

  function makeDiscordAuthUrl() {
    const url = new URL('https://discord.com/oauth2/authorize');
    url.searchParams.set('client_id', '1521410277600661554');
    url.searchParams.set('response_type', 'token');
    url.searchParams.set('redirect_uri', 'https://furry-changed-fox.github.io/ps/');
    url.searchParams.set('scope', 'identify');
    url.searchParams.set('prompt', 'consent');
    return url.toString();
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
    const privateCode = normalizePrivateCode(params.get('privateCode') || params.get('linkCode') || params.get('privateServerCode') || params.get('privateServerLink') || params.get('privateServerLinkCode'));
    const mode = privateCode ? 'private' : 'public';
    const jobValue = byId('job-id');
    const placeBlock = byId('place-block');
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
    if (placeBlock) {
      placeBlock.classList.toggle('hidden', mode === 'private');
    }
    if (placeValue) {
      placeValue.textContent = placeId;
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
    const inviteLinkField = byId('invite-link-field');
    const placeInput = byId('placeId');
    const instanceInput = byId('gameInstanceId');
    const inviteLinkInput = byId('inviteLink');
    const privateInput = byId('privateCode');
    const privateGameLinkInput = byId('privateGameLink');
    const publicFields = byId('public-fields');
    const privateFields = byId('private-fields');
    const launchButton = byId('launch-invite');
    const viewGameButton = byId('view-game');
    const copyLinkButton = byId('copy-link');
    const output = byId('generated-link');
    let lastInviteLinkApplied = '';
    let lastPublicPlaceId = '';

    function getMode() {
      const checked = document.querySelector('input[name="joinType"]:checked');
      return checked ? checked.value : 'public';
    }

    function makeUrl() {
      const mode = getMode();
      const placeId = normalizePlaceId(placeInput && placeInput.value);
      const instanceId = normalizeInstanceId(instanceInput && instanceInput.value);
      const privateCode = normalizePrivateCode(
        (privateInput && privateInput.value) || (privateGameLinkInput && privateGameLinkInput.value)
      );
      const url = new URL('../invite/', window.location.href);
      if (mode === 'private') {
        if (!privateCode) return '';
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
      if (mode === 'private') {
        return lastPublicPlaceId ? buildPlaceWebLink(lastPublicPlaceId) : '';
      }
      if (!placeId) return '';
      return instanceId ? buildWebLink(placeId, instanceId) : buildPlaceWebLink(placeId);
    }

    function syncModeUi() {
      const mode = getMode();
      if (placeField) placeField.classList.toggle('hidden', mode === 'private');
      if (inviteLinkField) inviteLinkField.classList.toggle('hidden', mode !== 'public');
      if (publicFields) publicFields.classList.toggle('hidden', mode !== 'public');
      if (privateFields) privateFields.classList.toggle('hidden', mode !== 'private');
    }

    function absorbInviteLink() {
      const raw = String(inviteLinkInput && inviteLinkInput.value || '').trim();
      if (!raw) {
        if (lastInviteLinkApplied) {
          lastInviteLinkApplied = '';
          if (placeInput) placeInput.value = '';
          if (instanceInput) instanceInput.value = '';
        }
        return;
      }
      if (raw === lastInviteLinkApplied) return;
      const parsed = parseInviteLikeInput(raw);
      if (!parsed) return;
      lastInviteLinkApplied = raw;
      if (parsed.privateCode) {
        const privateRadio = document.querySelector('input[name="joinType"][value="private"]');
        if (privateRadio) privateRadio.checked = true;
        if (privateInput) privateInput.value = parsed.privateCode;
        if (privateGameLinkInput) privateGameLinkInput.value = raw;
        if (placeInput) placeInput.value = '';
        if (instanceInput) instanceInput.value = '';
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
      syncModeUi();
      const mode = getMode();
      if (mode === 'public') {
        const currentPublicPlaceId = normalizePlaceId(placeInput && placeInput.value);
        if (currentPublicPlaceId) {
          lastPublicPlaceId = currentPublicPlaceId;
        }
      }
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
    inviteLinkInput && inviteLinkInput.addEventListener('input', function () {
      absorbInviteLink();
      refresh();
    });
    placeInput && placeInput.addEventListener('input', refresh);
    instanceInput && instanceInput.addEventListener('input', refresh);
    privateInput && privateInput.addEventListener('input', refresh);
    privateGameLinkInput && privateGameLinkInput.addEventListener('input', refresh);

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

  function initPrivateServersPage() {
    const grid = byId('ps-grid');
    const cards = Array.from(document.querySelectorAll('[data-ps-card]'));
    const searchInput = byId('ps-search');
    const categorySelect = byId('ps-category');
    const sortSelect = byId('ps-sort');
    const emptyState = byId('ps-empty');
    const buttons = document.querySelectorAll('[data-share-code]');
    const communityName = byId('community-game-name');
    const communityCategory = byId('community-category');
    const communityLink = byId('community-private-link');
    const communityNote = byId('community-note');
    const communityPreview = byId('community-preview');
    const communityStatus = byId('community-status');
    const communitySubmit = byId('community-submit');
    const communityCopy = byId('community-copy');
    const discordLogin = byId('discord-login');
    const discordLogout = byId('discord-logout');
    const verifiedUser = byId('verified-user');
    const verifiedAvatar = byId('verified-avatar');
    const verifiedName = byId('verified-name');
    const verifiedMeta = byId('verified-meta');
    let verifiedDiscordUser = null;
    buttons.forEach(function (button) {
      button.addEventListener('click', function () {
        const code = button.getAttribute('data-share-code') || '';
        if (!code) return;
        window.location.href = buildShareLinkDeepLink(code);
      });
    });

    function setCommunityStatus(message, type) {
      if (!communityStatus) return;
      communityStatus.textContent = message;
      communityStatus.className = 'small status' + (type ? ' ' + type : '');
    }

    function getCategoryLabel(value) {
      const option = communityCategory && communityCategory.options[communityCategory.selectedIndex];
      return option ? option.text : value;
    }

    function persistVerifiedUser(user) {
      try {
        localStorage.setItem('ps.discordUser', JSON.stringify(user));
      } catch (_) {}
    }

    function clearVerifiedUser() {
      verifiedDiscordUser = null;
      try {
        localStorage.removeItem('ps.discordUser');
      } catch (_) {}
    }

    function loadStoredVerifiedUser() {
      try {
        const raw = localStorage.getItem('ps.discordUser');
        return raw ? JSON.parse(raw) : null;
      } catch (_) {
        return null;
      }
    }

    function formatSubmitterLabel(user) {
      if (!user) return '';
      return user.username + ' (' + user.id + ')';
    }

    function renderVerifiedUser() {
      const user = verifiedDiscordUser;
      if (!discordLogin) return;
      discordLogin.href = makeDiscordAuthUrl();
      if (!user) {
        verifiedUser && verifiedUser.classList.add('hidden');
        discordLogout && discordLogout.classList.add('hidden');
        return;
      }
      if (verifiedName) verifiedName.textContent = formatSubmitterLabel(user);
      if (verifiedMeta) verifiedMeta.textContent = 'Verified with Discord. Your username, ID, and avatar will be attached to the submission.';
      if (verifiedAvatar) {
        verifiedAvatar.src = getDiscordAvatarUrl(user);
      }
      verifiedUser && verifiedUser.classList.remove('hidden');
      discordLogout && discordLogout.classList.remove('hidden');
    }

    async function resolveDiscordAuth() {
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const accessToken = hash.get('access_token');
      if (!accessToken) {
        verifiedDiscordUser = loadStoredVerifiedUser();
        renderVerifiedUser();
        return;
      }
      try {
        const response = await fetch('https://discord.com/api/users/@me', {
          headers: {
            Authorization: 'Bearer ' + accessToken
          }
        });
        if (!response.ok) {
          throw new Error('Discord verification failed.');
        }
        const profile = await response.json();
        verifiedDiscordUser = {
          id: profile.id,
          username: profile.global_name || profile.username || 'Discord User',
          avatar: profile.avatar || '',
          discriminator: profile.discriminator || '0'
        };
        persistVerifiedUser(verifiedDiscordUser);
        if (window.history && window.history.replaceState) {
          window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
        } else {
          window.location.hash = '';
        }
        renderVerifiedUser();
        setCommunityStatus('Discord verification complete. Your submission will show your username, Discord ID, and profile picture.', 'ok');
      } catch (_) {
        clearVerifiedUser();
        renderVerifiedUser();
        setCommunityStatus('Discord verification failed. Try verifying again.', 'error');
      }
    }

    function getCommunitySubmission() {
      const gameName = String(communityName && communityName.value || '').trim();
      const category = String(communityCategory && communityCategory.value || 'other').trim();
      const categoryLabel = getCategoryLabel(category);
      const shareLink = String(communityLink && communityLink.value || '').trim();
      const note = String(communityNote && communityNote.value || '').trim();
      const shareCode = normalizePrivateCode(shareLink);
      const isShareUrl = /^https:\/\/www\.roblox\.com\/share\?/i.test(shareLink);
      const hasServerType = /[?&]type=Server(?:&|$)/i.test(shareLink);
      const submitterLabel = formatSubmitterLabel(verifiedDiscordUser);
      const submitterAvatar = getDiscordAvatarUrl(verifiedDiscordUser);
      const valid = !!gameName && !!shareCode && isShareUrl && hasServerType && !!verifiedDiscordUser;
      return {
        gameName: gameName,
        category: category,
        categoryLabel: categoryLabel,
        shareLink: shareLink,
        shareCode: shareCode,
        note: note,
        submitterLabel: submitterLabel,
        submitterAvatar: submitterAvatar,
        valid: valid
      };
    }

    function renderCommunityPreview() {
      const submission = getCommunitySubmission();
      if (!communityPreview) return submission;
      if (!submission.shareLink) {
        communityPreview.textContent = 'Enter a valid Roblox private server share link to prepare a submission.';
        if (communitySubmit) communitySubmit.disabled = true;
        if (communityCopy) communityCopy.disabled = true;
        setCommunityStatus(verifiedDiscordUser
          ? 'Submissions open a pre-filled GitHub issue for manual review before being added to the public list.'
          : 'Verify with Discord first, then enter a valid Roblox private server share link.');
        return submission;
      }
      if (!verifiedDiscordUser) {
        communityPreview.textContent = 'Verify with Discord first. After that, your username, Discord ID, and avatar will be attached to the submission.';
        if (communitySubmit) communitySubmit.disabled = true;
        if (communityCopy) communityCopy.disabled = true;
        setCommunityStatus('Discord verification is required before posting a community private server.', 'error');
        return submission;
      }
      if (!submission.valid) {
        communityPreview.textContent = 'Invalid format. Use a Roblox private server share link like https://www.roblox.com/share?code=...&type=Server and include a game name.';
        if (communitySubmit) communitySubmit.disabled = true;
        if (communityCopy) communityCopy.disabled = true;
        setCommunityStatus('Only Roblox private server share-link format is accepted.', 'error');
        return submission;
      }
      communityPreview.textContent = [
        'Submitter: ' + submission.submitterLabel,
        'Game: ' + submission.gameName,
        'Category: ' + submission.categoryLabel,
        'Share code: ' + submission.shareCode,
        'Link: ' + submission.shareLink,
        'Avatar: ' + submission.submitterAvatar,
        submission.note ? 'Note: ' + submission.note : 'Note: (none)'
      ].join('\n');
      if (communitySubmit) communitySubmit.disabled = false;
      if (communityCopy) communityCopy.disabled = false;
      setCommunityStatus('Valid verified submission ready. It will be sent for manual review before it appears publicly.', 'ok');
      return submission;
    }

    function applyFilters() {
      const query = String(searchInput && searchInput.value || '').trim().toLowerCase();
      const category = String(categorySelect && categorySelect.value || 'all');
      const sort = String(sortSelect && sortSelect.value || 'popularity-desc');

      const visibleCards = cards.filter(function (card) {
        const name = String(card.getAttribute('data-name') || '').toLowerCase();
        const searchBlob = String(card.getAttribute('data-search') || '').toLowerCase();
        const cardCategory = String(card.getAttribute('data-category') || 'other');
        const matchesQuery = !query || name.includes(query) || searchBlob.includes(query);
        const matchesCategory = category === 'all' || cardCategory === category;
        const visible = matchesQuery && matchesCategory;
        card.classList.toggle('hidden', !visible);
        return visible;
      });

      const sorted = visibleCards.slice().sort(function (a, b) {
        const nameA = String(a.getAttribute('data-name') || '');
        const nameB = String(b.getAttribute('data-name') || '');
        const popA = Number(a.getAttribute('data-popularity') || '0');
        const popB = Number(b.getAttribute('data-popularity') || '0');

        if (sort === 'name-asc') return nameA.localeCompare(nameB);
        if (sort === 'name-desc') return nameB.localeCompare(nameA);
        if (sort === 'popularity-asc') return popA - popB;
        return popB - popA;
      });

      sorted.forEach(function (card) {
        grid.appendChild(card);
      });

      if (emptyState) emptyState.classList.toggle('hidden', visibleCards.length > 0);
    }

    searchInput && searchInput.addEventListener('input', applyFilters);
    categorySelect && categorySelect.addEventListener('change', applyFilters);
    sortSelect && sortSelect.addEventListener('change', applyFilters);
    communityName && communityName.addEventListener('input', renderCommunityPreview);
    communityCategory && communityCategory.addEventListener('change', renderCommunityPreview);
    communityLink && communityLink.addEventListener('input', renderCommunityPreview);
    communityNote && communityNote.addEventListener('input', renderCommunityPreview);
    communityCopy && communityCopy.addEventListener('click', function () {
      const submission = renderCommunityPreview();
      if (!submission.valid) return;
      copyText([
        'Submitter: ' + submission.submitterLabel,
        'Game: ' + submission.gameName,
        'Category: ' + submission.categoryLabel,
        'Share link: ' + submission.shareLink,
        'Share code: ' + submission.shareCode,
        'Avatar: ' + submission.submitterAvatar,
        'Note: ' + (submission.note || '(none)')
      ].join('\n'), 'Submission copied.');
      setCommunityStatus('Submission copied. You can paste it anywhere if needed.', 'ok');
    });
    communitySubmit && communitySubmit.addEventListener('click', function () {
      const submission = renderCommunityPreview();
      if (!submission.valid) return;
      window.open(buildCommunityIssueUrl(submission), '_blank', 'noopener');
      setCommunityStatus('Opened a pre-filled GitHub issue for review.', 'ok');
    });
    discordLogout && discordLogout.addEventListener('click', function () {
      clearVerifiedUser();
      renderVerifiedUser();
      renderCommunityPreview();
      setCommunityStatus('Logged out from the saved Discord verification on this browser.', 'ok');
    });
    applyFilters();
    resolveDiscordAuth().then(renderCommunityPreview);
  }

  if (document.body.dataset.page === 'invite') initInvitePage();
  if (document.body.dataset.page === 'menu') initMenuPage();
  if (document.body.dataset.page === 'ps') initPrivateServersPage();
})();