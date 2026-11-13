# Liel Links

Open `index.html` in a browser to preview. To publish, upload the contents of this folder to a static host and keep the files together. No build or package installation is required.

## Edit `config.js`

- Change the browser tab title in `pageTitle` and the name, handle, bio, avatar, or cover under `profile`. Place your image in `assets/` and enter the path, for example `"assets/my-avatar.jpg"`.
- Replace the sample URLs in `links` with your own. Duplicate a block to add a link, delete one to remove it, and move blocks up or down to reorder them. Use a full `https://` address, an email link like `mailto:you@example.com`, or a telephone link like `tel:+15551234567`.
- Set `featured: true` on a link to give it the lighter style. Omit that line for a dark card.
- Set `fonts.heading` and `fonts.body` to your preferred CSS font stacks. Inter is included. For another web font, put its CSS URL or the path to your own font stylesheet in `fonts.stylesheet`, then use that font's family name in the stacks.
- Edit `text` for the interface labels and feedback, and `theme` for the palette. For Hebrew, set `language: "he"` and `direction: "rtl"`, then translate the strings.
- Set `shareUrl` to your published address if you want the Share button to use a fixed URL. When blank, it uses the current page's address.

Example link block

```js
{
  title: "YouTube",
  description: "Watch my latest videos",
  url: "https://www.youtube.com/@yourhandle",
  icon: "youtube",
},
```

Icons include `discord`, `roblox`, `github`, `plane`, `camera`, `youtube`, `instagram`, `email`, `web`, and `link`. An unknown icon uses the link symbol.
