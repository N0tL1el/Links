"use strict";

const settings = window.LINK_PAGE;
const copy = settings.text;
const profile = settings.profile;
const root = document.documentElement;
const byId = (id) => document.getElementById(id);
const linkSchemes = ["https:", "http:", "mailto:", "tel:"];
const cardIcons = new Set(["discord", "roblox", "github", "plane", "camera", "youtube", "instagram", "email", "web", "link", "clock"]);
const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

function resolveUrl(value, protocols, base) {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const url = new URL(value.trim(), base);
    return protocols.includes(url.protocol) ? url : null;
  } catch {
    return null;
  }
}

function setOptionalText(element, value) {
  element.textContent = value || "";
  element.hidden = !value;
}

root.lang = settings.language;
root.dir = settings.direction === "rtl" ? "rtl" : "ltr";
root.style.setProperty("--body-font", settings.fonts.body);
root.style.setProperty("--heading-font", settings.fonts.heading);

const themeProperties = {
  background: "--background",
  surface: "--surface",
  text: "--text",
  muted: "--muted",
  border: "--border",
  highlight: "--highlight",
  highlightText: "--highlight-text",
};
for (const [key, property] of Object.entries(themeProperties)) {
  if (settings.theme[key]) root.style.setProperty(property, settings.theme[key]);
}

const assetSchemes = ["https:", "http:", "file:"];
const fontStylesheet = resolveUrl(settings.fonts.stylesheet, assetSchemes, document.baseURI);
if (fontStylesheet) {
  const stylesheet = document.createElement("link");
  stylesheet.rel = "stylesheet";
  stylesheet.href = fontStylesheet.href;
  document.head.append(stylesheet);
}

document.title = settings.pageTitle || profile.name;
document.querySelector('meta[name="description"]').content = profile.bio || "";
byId("profile-name").textContent = profile.name;
setOptionalText(byId("profile-handle"), profile.handle);
setOptionalText(byId("profile-bio"), profile.bio);
byId("avatar-mark").textContent = Array.from(profile.name.trim().split(/\s+/).slice(0, 2), (word) =>
  Array.from(word)[0]?.toLocaleUpperCase() || ""
).join("");

const avatar = resolveUrl(profile.avatar, assetSchemes, document.baseURI);
if (avatar) {
  const photo = byId("avatar-image");
  photo.addEventListener("load", () => { photo.hidden = false; });
  photo.addEventListener("error", () => { photo.hidden = true; });
  photo.src = avatar.href;
}

const cover = resolveUrl(profile.cover, assetSchemes, document.baseURI);
if (cover) {
  byId("cover").style.setProperty("--cover-image", `url(${JSON.stringify(cover.href)})`);
}

const dialog = byId("copy-dialog");
const dialogCopy = byId("dialog-copy");
const dialogValue = byId("dialog-value");
const discordUsername = byId("discord-username");
const dialogStatus = byId("dialog-status");
const dialogCopyLabel = byId("dialog-copy-label");
const toast = byId("toast");
const resetCopyTimers = new WeakMap();
let toastTimer;
let dialogState;

byId("dialog-close").setAttribute("aria-label", copy.close);

function openCopyDialog(value, opener, isDiscord = false) {
  if (dialog.open) return;
  dialogState = { value, opener, isDiscord };
  byId("dialog-title").textContent = isDiscord ? copy.discordTitle : copy.manualTitle;
  byId("dialog-hint").textContent = isDiscord ? copy.discordHint : copy.manualHint;
  dialogValue.value = value;
  dialogValue.hidden = isDiscord;
  dialogValue.setAttribute("aria-label", copy.address);
  setOptionalText(discordUsername, isDiscord ? value : "");
  dialogCopyLabel.textContent = isDiscord ? copy.copyUsername : copy.copyLink;
  dialogCopy.querySelector(".icon").classList.replace("icon-check", "icon-copy");
  dialogStatus.textContent = "";
  dialog.showModal();
  (isDiscord ? dialogCopy : dialogValue).focus({ preventScroll: true });
}

byId("dialog-close").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});
dialog.addEventListener("close", () => {
  if (!dialog.open) dialogState.opener.focus({ preventScroll: true });
});

dialogValue.addEventListener("focus", () => dialogValue.select());

async function writeClipboard(value) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // Continue with a selectable field when clipboard access is restricted.
  }

  const focused = document.activeElement;
  const field = document.createElement("textarea");
  field.className = "clipboard-proxy";
  field.value = value;
  field.readOnly = true;
  field.tabIndex = -1;
  (dialog.open ? dialog : document.body).append(field);
  field.focus({ preventScroll: true });
  field.select();
  field.setSelectionRange(0, value.length);

  let succeeded = false;
  try {
    succeeded = document.execCommand("copy");
  } catch {
    // The caller shows the address for manual copying.
  } finally {
    field.remove();
    focused?.focus({ preventScroll: true });
  }
  return succeeded;
}

function showLinkCopied(button) {
  const icon = button.querySelector(".icon");
  clearTimeout(resetCopyTimers.get(button));
  icon.classList.replace("icon-copy", "icon-check");
  button.dataset.copied = "";
  resetCopyTimers.set(button, setTimeout(() => {
    icon.classList.replace("icon-check", "icon-copy");
    delete button.dataset.copied;
  }, 1750));

  clearTimeout(toastTimer);
  byId("toast-text").textContent = copy.copied;
  toast.classList.add("is-visible");
  toastTimer = setTimeout(() => {
    toast.classList.remove("is-visible");
    byId("toast-text").textContent = "";
  }, 2300);
}

dialogCopy.addEventListener("click", async () => {
  const state = dialogState;
  const copied = await writeClipboard(state.value);
  if (dialogState !== state || !dialog.open) return;

  if (!copied) {
    byId("dialog-hint").textContent = state.isDiscord ? copy.manualUsernameHint : copy.manualHint;
    if (!state.isDiscord) dialogValue.focus();
    return;
  }

  if (state.isDiscord) {
    dialogCopy.querySelector(".icon").classList.replace("icon-copy", "icon-check");
    dialogCopyLabel.textContent = copy.usernameCopied;
    dialogStatus.textContent = copy.usernameCopied;
    return;
  }

  dialog.close();
  showLinkCopied(state.opener);
});

const linkList = byId("link-list");
const projectList = byId("project-list");
const cardTemplate = byId("card-template");
const copyTemplate = byId("copy-template");

function createCard(entry) {
  const card = cardTemplate.content.firstElementChild.cloneNode(true);
  const iconName = cardIcons.has(entry.icon) ? entry.icon : "link";
  card.querySelector(".card-tile .icon").classList.add(`icon-${iconName}`);
  card.querySelector(".card-title").textContent = entry.title;
  setOptionalText(card.querySelector(".card-description"), entry.description);
  return card;
}

for (const entry of settings.links) {
  if (typeof entry.title !== "string" || !entry.title.trim()) continue;
  const username = typeof entry.discordUsername === "string" ? entry.discordUsername.trim() : "";
  const url = username ? null : resolveUrl(entry.url, linkSchemes);
  if (!username && !url) continue;

  const card = createCard(entry);
  card.classList.add("card-interactive");
  card.classList.toggle("is-featured", Boolean(entry.featured));
  const contents = card.firstElementChild;
  const action = document.createElement(username ? "button" : "a");
  action.className = "card-content card-action";
  action.append(...contents.childNodes);
  contents.replaceWith(action);

  const actionIcon = document.createElement("span");
  actionIcon.className = username ? "icon card-arrow icon-chevron" : "icon card-arrow icon-arrow";
  actionIcon.setAttribute("aria-hidden", "true");
  action.append(actionIcon);

  if (username) {
    action.type = "button";
    action.setAttribute("aria-haspopup", "dialog");
    action.setAttribute("aria-controls", dialog.id);
    action.addEventListener("click", () => openCopyDialog(username, action, true));
  } else {
    action.href = url.href;
    if (/^https?:$/.test(url.protocol)) {
      action.target = "_blank";
      action.rel = "noopener noreferrer";
    }

    const button = copyTemplate.content.firstElementChild.cloneNode(true);
    const buttonLabel = copy.copyLinkFor.replace("{title}", () => entry.title);
    button.setAttribute("aria-label", buttonLabel);
    button.title = buttonLabel;
    button.addEventListener("click", async () => {
      if (await writeClipboard(url.href)) {
        showLinkCopied(button);
        return;
      }
      openCopyDialog(url.href, button);
    });
    card.append(button);
  }

  card.addEventListener("pointermove", (event) => {
    if (!finePointer.matches || reducedMotion.matches || event.pointerType === "touch") return;
    const bounds = card.getBoundingClientRect();
    card.style.setProperty("--pointer-x", `${event.clientX - bounds.left}px`);
    card.style.setProperty("--pointer-y", `${event.clientY - bounds.top}px`);
  });
  linkList.append(card);
}

if (!linkList.childElementCount) {
  setOptionalText(byId("no-links"), copy.noLinks);
  byId("links-panel").tabIndex = 0;
}

for (const project of settings.projects || []) {
  if (typeof project.title !== "string" || !project.title.trim()) continue;
  projectList.append(createCard(project));
}
if (!projectList.childElementCount) {
  projectList.append(createCard({
    title: copy.noProjectsTitle,
    description: copy.noProjectsDescription,
    icon: "clock",
  }));
}

const tabList = byId("profile-tabs");
const tabs = Array.from(tabList.querySelectorAll('[role="tab"]'));
tabList.setAttribute("aria-label", copy.tabsLabel);
byId("links-tab").textContent = copy.linksHeading;
byId("projects-tab").textContent = copy.projectsHeading;

function selectTab(selectedTab) {
  for (const tab of tabs) {
    const selected = tab === selectedTab;
    tab.setAttribute("aria-selected", String(selected));
    tab.tabIndex = selected ? 0 : -1;
    byId(tab.getAttribute("aria-controls")).hidden = !selected;
  }
}

for (const tab of tabs) {
  tab.addEventListener("click", () => selectTab(tab));
  tab.addEventListener("keydown", (event) => {
    const backwards = root.dir === "rtl" ? "ArrowRight" : "ArrowLeft";
    const forwards = root.dir === "rtl" ? "ArrowLeft" : "ArrowRight";
    const index = tabs.indexOf(tab);
    let nextIndex;
    switch (event.key) {
      case backwards: nextIndex = (index + tabs.length - 1) % tabs.length; break;
      case forwards: nextIndex = (index + 1) % tabs.length; break;
      case "Home": nextIndex = 0; break;
      case "End": nextIndex = tabs.length - 1; break;
      default: return;
    }
    event.preventDefault();
    const nextTab = tabs[nextIndex];
    selectTab(nextTab);
    nextTab.focus();
  });
}

byId("profile-sections").hidden = false;
