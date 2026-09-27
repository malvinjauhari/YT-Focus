# Contributing to YTFocus

Thanks for taking the time to contribute. YTFocus is deliberately small — about 300 lines across four files, with no build step — which means a good contribution is usually a small, well-targeted one.

**Bahasa:** contributions in English or Indonesian are both welcome. If you update the docs, note that `README.md` is English (default) and `READMEID.md` is the Indonesian mirror; changes should land in both.

## Table of Contents

- [Ways to Contribute](#ways-to-contribute)
- [Local Setup](#local-setup)
- [The Edit–Reload Loop](#the-editreload-loop)
- [Code Style](#code-style)
- [Recipe: Adding a New Blur Target](#recipe-adding-a-new-blur-target)
- [Commit Conventions](#commit-conventions)
- [Pull Requests](#pull-requests)
- [Reporting Bugs](#reporting-bugs)
- [Security Reports](#security-reports)
- [Things That Won't Be Accepted](#things-that-wont-be-accepted)

## Ways to Contribute

**The highest-value contribution right now** is fixing selectors after a YouTube redesign. YouTube ships UI changes constantly, and when a selector stops matching, the blur silently stops applying. If you notice that, [open an issue](https://github.com/malvinjauhari/YT-Focus/issues) with the page URL — even if you don't intend to fix it yourself.

Other welcome contributions:

- New blur targets (shorts shelf, chapter list, "Up next" overlays, mobile web UI).
- A Firefox-compatible build. Manifest V3 support in Firefox is close, and `background`/`service_worker` differences are the main porting work.
- Accessibility improvements to the popup (focus states, `aria-*` attributes, keyboard navigation).
- Translations of the popup UI, which is currently Indonesian-only.
- Better documentation, including screenshots.

## Local Setup

```bash
git clone https://github.com/malvinjauhari/YT-Focus.git
cd YT-Focus
```

There is nothing to install. No `npm install`, no bundler, no linter config to satisfy. If you find yourself adding a dependency, pause — that is almost certainly the wrong move for this project.

Load it into your browser:

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked** and select the repository folder.

## The Edit–Reload Loop

1. Edit a file.
2. `chrome://extensions` → **Reload** on YTFocus.
3. Refresh the YouTube tab. Use a hard refresh (`Ctrl`/`Cmd` + `Shift` + `R`) after editing `content.js`, since the content script is injected at `document_start` and can otherwise be served from cache.
4. Verify the change, then commit.

To check for JavaScript errors, open DevTools on the YouTube tab. A stray error in `content.js` will break every setting in that tab, so always confirm the console is clean.

## Code Style

- **Vanilla JavaScript only.** No framework, no bundler, no transpiler, no dependencies. The code in the repo is the code the browser runs.
- **Two-space indentation**, semicolons, single quotes — match the surrounding file.
- **Inline comments are in Indonesian.** This matches the original codebase; please keep new comments consistent with the file you're editing. Comments should explain *why*, not restate *what*.
- **The class-toggling pattern is load-bearing.** Visual behaviour belongs in the CSS block inside `injectCSS()`, gated behind `ytf-blur-comments` or `ytf-blur-recs`. Do not write JavaScript that walks the DOM to find and restyle elements — that's the thing this architecture exists to avoid, and it's what keeps CPU at zero during playback.
- **Keep `pointer-events: none` and `user-select: none`** on any new blur target, so blurred content can't be clicked or selected.
- **Never add a permission** to `manifest.json` without discussing it in an issue first. The current three are justified in [README.md](./README.md#permissions-explained), and the Chrome Web Store review process gets much stricter with every addition.

## Recipe: Adding a New Blur Target

This is the most common contribution, and the pattern lives in one place — the `textContent` template inside `injectCSS()` in `content.js`.

**1. Inspect the element in DevTools.** Right-click the element you want blurred on a YouTube page and copy its CSS selector. Prefer a stable custom-element name (`ytd-...`) over a generated class like `.ytp-...-style-abc123`, which changes on every deploy.

**2. Add it to the appropriate selector group:**

```css
html.ytf-blur-comments ytd-comments,
html.ytf-blur-comments #comments,
html.ytf-blur-recs ytd-watch-next-secondary-results-renderer,
html.ytf-blur-recs ytd-item-section-renderer[page-subtype="watch-next"],
html.ytf-blur-recs .ytp-endscreen-content,
html.ytf-blur-recs .ytp-ce-video {
  filter: blur(12px) opacity(0.7) !important;
  pointer-events: none !important;
  user-select: none !important;
  will-change: filter, opacity;
  transform: translateZ(0);
  transition: filter 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
}
```

Put the new selector in the group matching its toggle — `ytf-blur-comments` for comment-related UI, `ytf-blur-recs` for recommendation-related UI. Don't duplicate the property block; add to the existing group.

**3. If it needs a new toggle**, you have more work: add the key to the defaults in `applySettings()`, to the defaults in `init()`, to the defaults in `popup.js`, and add a row to `popup.html` plus the `change` listener binding. Then update the settings table in both READMEs.

**4. Verify** that the new target blurs, that scrolling stays smooth, and that toggling still works. Then confirm the console is clean.

**5. Bump the version** in `manifest.json` if this is a user-facing change, and mention the version in your PR description.

## Commit Conventions

This project follows [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<optional scope>): <short imperative description>
```

Types in use here:

| Type | Use for |
|---|---|
| `feat` | A new user-visible capability (e.g. `feat: blur the shorts shelf`) |
| `fix` | A bug fix (e.g. `fix: restore classes after YouTube SPA navigation`) |
| `docs` | README, CONTRIBUTING, or comment-only changes |
| `refactor` | Behaviour-preserving code changes |
| `perf` | Performance improvements, especially to the CSS or observer |
| `chore` | Repo maintenance, dependency-free config, `.gitignore` |

Keep the subject line under ~72 characters, in the imperative mood ("add", not "added"), with no trailing period. Use the body for the *why* — especially for non-obvious selectors — and reference issues with `Closes #123`.

Examples from this repo's history:

```
feat: YTFocus v1.0 — blur YouTube comments and recommendations
docs: add bilingual README, MIT license, and contributing guide
```

## Pull Requests

1. **Open an issue first** for anything beyond a small fix. It's cheaper to agree on an approach than to rework a finished PR.
2. **Branch from `main`:** `git checkout -b fix/comments-blur-after-navigation`
3. **Keep the diff focused.** Unrelated reformatting makes review much harder. If you want to reformat the codebase, do it in its own PR.
4. **Update both READMEs** if you change user-facing behaviour or settings.
5. **Describe how you tested it** — which pages, which browsers, whether you checked the console.
6. One logical change per PR.

You'll get a response. If something is requested that isn't clear, say so and we'll sort it out.

## Reporting Bugs

Please include:

- **What you expected** and **what happened instead**.
- **The exact YouTube page URL** and which page type it is (watch, search, home, shorts).
- **Your browser and version** (e.g. Chrome 141 on Windows 11).
- **A screenshot** with the blur failure visible.
- **Console output** from DevTools if there are errors.

## Security Reports

**Do not open a public issue for a security vulnerability.** Use GitHub's private reporting on the Security tab of the repository, or email the maintainer directly.

Please include reproduction steps and the impact. You can expect an acknowledgement within a few days. Fixes for verified issues ship as quickly as the review process allows, and credit is offered to reporters who want it.

Note that YTFocus has no server, no remote code, and no network access at all, so the realistic threat surface is limited to the permissions it declares and DOM-level injection from a compromised YouTube page.

## Things That Won't Be Accepted

To keep the project trustworthy and maintainable:

- **New permissions** or host patterns beyond YouTube, without prior discussion.
- **Analytics, telemetry, or any network request of any kind.** This is an absolute rule. YTFocus's value proposition is that it doesn't watch you, and it cannot do that if it phones home.
- **Remote code or dynamic script loading.** Prohibited by Manifest V3 and contrary to the project's design.
- **Frameworks, bundlers, or a `node_modules` tree.** The zero-dependency constraint is a feature, not an accident.
- **Rewrites of the core architecture** in a single PR. Propose it in an issue first.

## License

By contributing, you agree that your contributions are licensed under the [MIT License](./LICENSE), the same terms as the rest of the project.

Thanks again — genuinely useful contributions to a small project go a long way.
