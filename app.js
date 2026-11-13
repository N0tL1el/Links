"use strict";

const settings = window.LINK_PAGE;
const copy = settings.text;
const profile = settings.profile;
const root = document.documentElement;
const byId = (id) => document.getElementById(id);
const linkSchemes = ["https:", "http:", "mailto:", "tel:"];
const cardIcons = new Set(["discord", "roblox", "github", "plane", "camera", "youtube", "instagram", "email", "web", "link"]);
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

const shareButton = byId("share-button");
const dialog = byId("share-dialog");
const dialogCopy = byId("dialog-copy");
const nativeShare = byId("dialog-native");
const address = byId("share-address");
const toast = byId("toast");
const localAddress = new URL(window.location.href);
localAddress.search = "";
localAddress.hash = "";
const shareAddress = resolveUrl(settings.shareUrl, ["https:", "http:"]) || localAddress;
const resetCopyTimers = new WeakMap();
let toastTimer;
let dialogState;

byId("share-label").textContent = copy.shareButton;
byId("dialog-copy-label").textContent = copy.copyLink;
byId("dialog-native-label").textContent = copy.nativeShare;
byId("dialog-close").setAttribute("aria-label", copy.close);
address.setAttribute("aria-label", copy.address);

function openDialog({ url, title, hint, opener, allowNative = false }) {
  if (dialog.open) return;
  const shareData = { title: document.title, url };
  dialogState = { opener, shareData };
  byId("dialog-title").textContent = title;
  byId("dialog-hint").textContent = hint;
  address.value = url;
  nativeShare.hidden = !(
    allowNative &&
    /^https?:/.test(url) &&
    typeof navigator.share === "function" &&
    (!navigator.canShare || navigator.canShare(shareData))
  );
  dialog.showModal();
  address.focus({ preventScroll: true });
  address.select();
}

shareButton.addEventListener("click", () => {
  openDialog({
    url: shareAddress.href,
    title: copy.shareTitle,
    hint: shareAddress.protocol === "file:" ? copy.localShareHint : copy.shareHint,
    opener: shareButton,
    allowNative: true,
  });
});
shareButton.hidden = false;

byId("dialog-close").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});
dialog.addEventListener("close", () => {
  if (!dialog.open) dialogState.opener.focus();
});

nativeShare.addEventListener("click", async () => {
  const state = dialogState;
  try {
    await navigator.share(state.shareData);
    if (dialogState === state) dialog.close();
  } catch (error) {
    if (error.name !== "AbortError" && dialogState === state && dialog.open) address.focus();
  }
});

address.addEventListener("focus", () => address.select());

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

function showCopied(button) {
  const icon = button.querySelector(".icon");
  const idleIcon = button === shareButton ? "icon-share" : "icon-copy";
  clearTimeout(resetCopyTimers.get(button));
  icon.classList.replace(idleIcon, "icon-check");
  button.dataset.copied = "";
  resetCopyTimers.set(button, setTimeout(() => {
    icon.classList.replace("icon-check", idleIcon);
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
  const copied = await writeClipboard(state.shareData.url);
  if (dialogState !== state) return;
  if (copied) {
    if (dialog.open) dialog.close();
    showCopied(state.opener);
    return;
  }
  if (!dialog.open) return;
  byId("dialog-hint").textContent = copy.manualHint;
  address.focus();
  address.select();
});

const list = byId("link-list");
const template = byId("card-template");
for (const entry of settings.links) {
  const url = resolveUrl(entry.url, linkSchemes);
  if (!url || typeof entry.title !== "string" || !entry.title.trim()) continue;

  const card = template.content.firstElementChild.cloneNode(true);
  const anchor = card.querySelector(".card-link");
  const button = card.querySelector(".copy-button");
  const icon = card.querySelector(".card-tile .icon");
  const iconName = cardIcons.has(entry.icon) ? entry.icon : "link";

  if (entry.featured) card.classList.add("is-featured");
  anchor.href = url.href;
  if (!/^https?:$/.test(url.protocol)) anchor.removeAttribute("target");
  icon.classList.add(`icon-${iconName}`);
  card.querySelector(".card-title").textContent = entry.title;
  setOptionalText(card.querySelector(".card-description"), entry.description);
  const buttonLabel = copy.copyLinkFor.replace("{title}", () => entry.title);
  button.setAttribute("aria-label", buttonLabel);
  button.title = buttonLabel;

  button.addEventListener("click", async () => {
    if (await writeClipboard(url.href)) {
      showCopied(button);
      return;
    }
    openDialog({ url: url.href, title: copy.manualTitle, hint: copy.manualHint, opener: button });
  });

  card.addEventListener("pointermove", (event) => {
    if (!finePointer.matches || reducedMotion.matches || event.pointerType === "touch") return;
    const bounds = card.getBoundingClientRect();
    card.style.setProperty("--pointer-x", `${event.clientX - bounds.left}px`);
    card.style.setProperty("--pointer-y", `${event.clientY - bounds.top}px`);
  });
  list.append(card);
}

if (list.childElementCount) {
  byId("links-heading").textContent = copy.linksHeading;
  byId("links-section").hidden = false;
}
