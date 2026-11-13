/*
  Edit this file to personalize the page.
  Add, remove, or reorder objects inside links. Use full https:// URLs.
  Use "" to hide the handle, bio, or a link's description. Leave avatar blank for initials.
*/
window.LINK_PAGE = {
  language: "en",
  direction: "ltr",
  pageTitle: "Liel | Links",
  shareUrl: "", // Optional published URL. Blank uses the current page's address.

  profile: {
    name: "Liel",
    handle: "@liel",
    bio: "Plane spotting, Roblox, and the things I build online.",
    avatar: "", // Example: "assets/my-avatar.jpg"
    cover: "assets/flight.webp",
  },

  fonts: {
    heading: '"Inter", system-ui, sans-serif',
    body: '"Inter", system-ui, sans-serif',
    stylesheet: "", // Optional URL or local CSS file that loads another font.
  },

  theme: {
    background: "#0b0b0b",
    surface: "#151515",
    text: "#f7f7f7",
    muted: "#a7a7a7",
    border: "#2a2a2a",
    highlight: "#ededed",
    highlightText: "#121212",
  },

  text: {
    linksHeading: "Links",
    shareButton: "Share",
    shareTitle: "Share this profile",
    shareHint: "Copy this link to send the profile to someone.",
    localShareHint: "Set shareUrl in config.js to your published web address.",
    nativeShare: "Share via device",
    copyLink: "Copy link",
    copyLinkFor: "Copy {title} link",
    copied: "Link copied",
    close: "Close",
    address: "Link address",
    manualTitle: "Copy this link",
    manualHint: "Select and copy the address below.",
  },

  // Icons: discord, roblox, github, plane, camera, youtube, instagram, email, web, link.
  // The sample URLs below go to public pages. Swap in your own profiles or invite.
  links: [
    {
      title: "Discord",
      description: "Discover gaming and tech communities",
      url: "https://discord.com/servers",
      icon: "discord",
      featured: true,
    },
    {
      title: "Roblox",
      description: "Browse games and experiences",
      url: "https://www.roblox.com/charts",
      icon: "roblox",
    },
    {
      title: "GitHub",
      description: "Explore Roblox development projects",
      url: "https://github.com/topics/roblox",
      icon: "github",
    },
    {
      title: "Plane spotting",
      description: "Browse aviation photography",
      url: "https://commons.wikimedia.org/wiki/Category:Aircraft_in_flight",
      icon: "plane",
    },
  ],
};
