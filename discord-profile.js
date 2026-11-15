/* Live Discord profile powered by Lanyard. No Discord bot token is required. */
(() => {
  'use strict';

  const DISCORD_USER_ID = '989918538787614750';
  const SOCKET_URL = 'wss://api.lanyard.rest/socket';
  const LANYARD_INVITE_URL = 'https://discord.gg/lanyard';
  const DISCORD_PROFILE_URL = `https://discord.com/users/${DISCORD_USER_ID}`;
  const BADGES = [
    { flag: 1, label: 'Discord Staff', mark: '◆' },
    { flag: 2, label: 'Partner', mark: '✦' },
    { flag: 4, label: 'HypeSquad Events', mark: '◇' },
    { flag: 8, label: 'Bug Hunter', mark: '⌘' },
    { flag: 64, label: 'House of Bravery', mark: '▲' },
    { flag: 128, label: 'House of Brilliance', mark: '✧' },
    { flag: 256, label: 'House of Balance', mark: '◈' },
    { flag: 512, label: 'Early Supporter', mark: '★' },
    { flag: 16384, label: 'Bug Hunter Level 2', mark: '⌘' },
    { flag: 65536, label: 'Verified Bot', mark: '✓' },
    { flag: 131072, label: 'Early Verified Bot Developer', mark: '⌁' },
    { flag: 262144, label: 'Discord Certified Moderator', mark: '◆' },
    { flag: 4194304, label: 'Active Developer', mark: '⌁' }
  ];

  function makeElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function createCard() {
    const section = makeElement('section', 'discord-profile');
    section.id = 'discord-profile';
    section.setAttribute('aria-label', 'Discord profile');
    section.dataset.status = 'offline';

    const identity = makeElement('div', 'discord-profile__identity');
    const avatarWrap = makeElement('div', 'discord-profile__avatar-wrap');
    const avatar = makeElement('img', 'discord-profile__avatar');
    avatar.alt = 'Discord avatar';
    avatar.loading = 'lazy';
    avatarWrap.append(avatar, makeElement('span', 'discord-profile__status-dot'));

    const nameLink = makeElement('a');
    nameLink.href = DISCORD_PROFILE_URL;
    nameLink.target = '_blank';
    nameLink.rel = 'noopener noreferrer';
    nameLink.style.color = 'inherit';
    nameLink.style.textDecoration = 'none';
    const name = makeElement('h2', 'discord-profile__name', 'Discord');
    nameLink.append(name);

    const handle = makeElement('p', 'discord-profile__handle', 'Loading profile…');
    const badges = makeElement('div', 'discord-profile__badges');
    badges.setAttribute('aria-label', 'Discord badges');
    const customStatus = makeElement('p', 'discord-profile__custom-status');

    identity.append(avatarWrap, nameLink, handle, badges, customStatus);

    const activity = makeElement('div', 'discord-profile__activity');
    const activityImage = makeElement('img', 'discord-profile__activity-image');
    activityImage.alt = '';
    activityImage.hidden = true;
    const activityCopy = makeElement('div', 'discord-profile__activity-copy');
    const activityTitle = makeElement('p', 'discord-profile__activity-title', 'Connecting to Discord…');
    const activityDetail = makeElement('p', 'discord-profile__activity-detail', 'Live presence will appear here');
    const activityState = makeElement('span', 'discord-profile__activity-state', 'Status unavailable');
    activityCopy.append(activityTitle, activityDetail, activityState);
    activity.append(activityImage, activityCopy);

    const footer = makeElement('div', 'discord-profile__footer');
    const profileLink = makeElement('a', '', 'View Discord profile');
    profileLink.href = DISCORD_PROFILE_URL;
    profileLink.target = '_blank';
    profileLink.rel = 'noopener noreferrer';
    footer.append(profileLink);

    section.append(identity, activity, footer);
    return { section, avatar, name, handle, badges, customStatus, activityImage, activityTitle, activityDetail, activityState, footer };
  }

  function avatarUrl(user) {
    if (user && user.avatar) {
      const extension = user.avatar.startsWith('a_') ? 'gif' : 'png';
      return `https://cdn.discordapp.com/avatars/${DISCORD_USER_ID}/${user.avatar}.${extension}?size=256`;
    }
    const discriminator = Number(user && user.discriminator) || 0;
    return `https://cdn.discordapp.com/embed/avatars/${discriminator % 5}.png`;
  }

  function activityDescription(presence) {
    const activities = Array.isArray(presence.activities) ? presence.activities : [];
    const custom = activities.find((item) => item.type === 4 && (item.state || item.emoji));
    const activity = activities.find((item) => item.type !== 4 && item.name !== 'Custom Status');
    let customText = '';
    if (custom) {
      const emojiText = custom.emoji && (custom.emoji.name || custom.emoji.id)
        ? `${custom.emoji.name || ''} ` : '';
      customText = `${emojiText}${custom.state || ''}`.trim();
    }

    if (!activity) {
      return {
        customText,
        title: 'No current activity',
        detail: 'Not playing or listening to anything right now.',
        image: ''
      };
    }

    const verbs = { 0: 'Playing', 1: 'Streaming', 2: 'Listening to', 3: 'Watching', 5: 'Competing in' };
    const verb = verbs[activity.type] || 'Using';
    const title = activity.name === 'Spotify'
      ? `Listening to ${presence.spotify && presence.spotify.song ? presence.spotify.song : 'Spotify'}`
      : `${verb} ${activity.name || 'an activity'}`;
    let detail = '';
    if (activity.name === 'Spotify' && presence.spotify) {
      const artist = presence.spotify.artist ? `by ${presence.spotify.artist}` : '';
      detail = [artist, presence.spotify.album].filter(Boolean).join(' · ');
    } else {
      detail = [activity.details, activity.state].filter(Boolean).join(' · ');
    }
    const image = activity.name === 'Spotify' && presence.spotify
      ? presence.spotify.album_art_url || ''
      : '';
    return { customText, title, detail: detail || 'Discord activity', image };
  }

  function renderBadges(container, publicFlags) {
    container.replaceChildren();
    const flags = Number(publicFlags) || 0;
    const earned = BADGES.filter((badge) => (flags & badge.flag) === badge.flag);
    if (!earned.length) {
      container.append(makeElement('span', 'discord-profile__badge', 'No public badges'));
      return;
    }
    earned.forEach((badge) => {
      const chip = makeElement('span', 'discord-profile__badge');
      chip.title = badge.label;
      chip.setAttribute('aria-label', badge.label);
      chip.append(makeElement('span', 'discord-profile__badge-mark', badge.mark));
      chip.append(document.createTextNode(badge.label));
      container.append(chip);
    });
  }

  function render(elements, presence) {
    const user = presence.discord_user || {};
    const status = ['online', 'idle', 'dnd'].includes(presence.discord_status)
      ? presence.discord_status : 'offline';
    elements.section.dataset.status = status;
    elements.avatar.src = avatarUrl(user);
    elements.name.textContent = user.global_name || user.username || 'Discord user';
    elements.handle.textContent = user.username ? `@${user.username}` : 'Discord profile';
    renderBadges(elements.badges, user.public_flags);

    const current = activityDescription(presence);
    elements.customStatus.textContent = current.customText;
    elements.customStatus.hidden = !current.customText;
    elements.activityTitle.textContent = current.title;
    elements.activityDetail.textContent = current.detail;
    elements.activityState.textContent = status === 'dnd'
      ? 'Do Not Disturb'
      : status.charAt(0).toUpperCase() + status.slice(1);

    if (current.image) {
      elements.activityImage.src = current.image;
      elements.activityImage.hidden = false;
    } else {
      elements.activityImage.removeAttribute('src');
      elements.activityImage.hidden = true;
    }
  }

  function renderNotMonitored(elements) {
    elements.handle.textContent = 'Live Discord presence';
    elements.activityTitle.textContent = 'Not connected to Lanyard yet';
    elements.activityDetail.textContent = 'Join the Lanyard Discord server to make your live status and activity available here.';
    elements.activityState.textContent = 'Waiting for presence data';
    const joinLink = makeElement('a', '', 'Join Lanyard');
    joinLink.href = LANYARD_INVITE_URL;
    joinLink.target = '_blank';
    joinLink.rel = 'noopener noreferrer';
    elements.footer.append(document.createTextNode(' · '), joinLink);
  }

  function connect(elements) {
    let socket;
    let heartbeatTimer;
    let reconnectTimer;
    let retryDelay = 2000;
    let receivedPresence = false;
    let manuallyClosed = false;

    const clearTimers = () => {
      if (heartbeatTimer) window.clearInterval(heartbeatTimer);
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      heartbeatTimer = undefined;
      reconnectTimer = undefined;
    };

    const scheduleReconnect = () => {
      clearTimers();
      if (manuallyClosed) return;
      reconnectTimer = window.setTimeout(openSocket, retryDelay);
      retryDelay = Math.min(retryDelay * 1.7, 30000);
    };

    const openSocket = () => {
      if (manuallyClosed) return;
      try {
        socket = new WebSocket(SOCKET_URL);
      } catch {
        scheduleReconnect();
        return;
      }

      socket.addEventListener('open', () => { retryDelay = 2000; });
      socket.addEventListener('message', (event) => {
        let message;
        try { message = JSON.parse(event.data); } catch { return; }

        if (message.op === 1 && message.d && message.d.heartbeat_interval) {
          if (heartbeatTimer) window.clearInterval(heartbeatTimer);
          heartbeatTimer = window.setInterval(() => {
            if (socket && socket.readyState === WebSocket.OPEN) {
              socket.send(JSON.stringify({ op: 3 }));
            }
          }, message.d.heartbeat_interval);
          socket.send(JSON.stringify({ op: 2, d: { subscribe_to_ids: [DISCORD_USER_ID] } }));
          return;
        }

        if (message.op !== 0 || !message.d) return;
        let presence = null;
        if (message.t === 'INIT_STATE') {
          presence = message.d[DISCORD_USER_ID] || null;
        } else if (message.t === 'PRESENCE_UPDATE') {
          presence = message.d.user_id === DISCORD_USER_ID ||
            (message.d.discord_user && message.d.discord_user.id === DISCORD_USER_ID)
            ? message.d : (message.d[DISCORD_USER_ID] || null);
        }

        if (presence) {
          receivedPresence = true;
          render(elements, presence);
        } else if (message.t === 'INIT_STATE' && !receivedPresence) {
          renderNotMonitored(elements);
        }
      });
      socket.addEventListener('close', scheduleReconnect);
      socket.addEventListener('error', () => {
        try { socket.close(); } catch { scheduleReconnect(); }
      });
    };

    window.addEventListener('pagehide', () => {
      manuallyClosed = true;
      clearTimers();
      if (socket) socket.close();
    }, { once: true });

    openSocket();
  }

  function init() {
    if (document.getElementById('discord-profile')) return;
    const elements = createCard();
    const host = document.querySelector('main.page') || document.querySelector('main') || document.body;
    host.append(elements.section);
    connect(elements);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
