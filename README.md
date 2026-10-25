<div align="center">

# ویرایشگر مارک‌داون راست‌به‌چپ

**RTL Markdown Editor** — a small, fast Markdown editor built for Persian, Arabic and Hebrew.

[Live demo](https://isalehgholami.github.io/rtl-md-persian/) · [Report a bug](https://github.com/isalehgholami/rtl-md-persian/issues)

</div>

## Features

- Live preview, side by side on desktop and stacked on mobile
- **Full-screen render** mode (with browser fullscreen)
- Correct RTL typography with [Vazirmatn](https://github.com/rastikerdar/vazirmatn); code blocks stay LTR
- Responsive tables that scroll inside their own container
- RTL / LTR toggle, light / dark theme, one-click HTML copy
- Autosaves to `localStorage`; no backend, no tracking

## Run locally

It is a static site, so any file server works:

```bash
python -m http.server 8000
```

Then open <http://localhost:8000>.

## Deploy to GitHub Pages

1. Push to the `main` branch.
2. In the repository go to **Settings → Pages** and set **Source** to **GitHub Actions**.
3. The workflow in [`.github/workflows/pages.yml`](.github/workflows/pages.yml) publishes the site on every push.

## Notes

- Tables: escape a literal pipe inside a cell as `\|` (or put it in backticks), otherwise it starts a new column.
- The font is loaded from the jsDelivr CDN. To work fully offline, copy the Vazirmatn font files into the repo and point `index.html` at them.

## Credits

Developed by [@iSalehGholami](https://github.com/iSalehGholami). Inspired by [dariubs/rtlmd](https://github.com/dariubs/rtlmd). Markdown parsing by [marked](https://github.com/markedjs/marked).

## License

[MIT](license)
