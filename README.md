# FIFA World Cup 2026 Schedule

FIFAワールドカップ2026の全104試合について、日本時間のキックオフ、放送局、配信サイトをまとめた静的HTMLです。

## Public URL

- GitHub Pages: https://onihachi.github.io/worldcup2026/
- CDN fallback: https://cdn.jsdelivr.net/gh/onihachi/worldcup2026@main/index.html

## Development

This is a static site. Edit `index.html`, then publish with:

```sh
git add index.html README.md
git commit -m "Update schedule"
git push
```

GitHub Pages publishes from the `main` branch root.

## Free update flow

- Primary updates run from the Mac/Codex heartbeat at 7:00, 12:00, and 18:00 JST.
- `.github/workflows/free-fallback-update.yml` runs as a no-cost GitHub Actions fallback at 8:20, 13:10, and 19:10 JST.
- The fallback uses ESPN's public scoreboard data for final scores and only applies Japan-viewable highlights listed in `data/highlights.json`.
- The fallback commits only when `index.html` actually changes.
