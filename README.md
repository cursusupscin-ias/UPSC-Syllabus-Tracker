# Personal UPSC Tracker

One codebase: website, GitHub Pages site, installable PWA, and an Android APK (Trusted Web Activity).
Sign-in is **Google only** (Firebase Authentication). Your progress lives at `users/{uid}/data/…` in Firestore, with a local copy in the browser for offline use.

## Files
`index.html` (the app) · `firebase-config.js` · `manifest.webmanifest` · `sw.js` · icons · `.github/` (APK workflow) · `.nojekyll`

## 1. Firebase (already done for project `upsc-syllabus-tracker-1f63e`)
- Authentication > Sign-in method: **Google** enabled.
- Firestore rules (note the `{document=**}`: the app stores data in sub-collections, so a rule that only matches `/users/{uid}` would block it):

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```
- **Authentication > Settings > Authorized domains**: add `YOUR-USERNAME.github.io` (without a path). Without this, Google sign-in fails with `auth/unauthorized-domain`.

## 2. GitHub Pages
Repository **Settings > Pages**: deploy from branch `main`, folder `/ (root)`. All paths in the project are relative, so it works at `https://USER.github.io/` and at `https://USER.github.io/REPO/`.

## 3. Signing key (once)
The APK must always be signed with the same key, or Android will refuse updates. Pages is free only for public repos, and files uploaded as artifacts in a public repo are downloadable by anyone, so **the workflow will not create a key in a public repo**. Create it on your own computer:

```bash
keytool -genkeypair -v -keystore release.keystore -alias upsc-tracker -keyalg RSA -keysize 2048 -validity 10000
base64 -w0 release.keystore        # macOS: base64 -i release.keystore
```
Keep `release.keystore` and its password somewhere safe (never commit it; `.gitignore` blocks it). Then add repository **secrets**:

| Secret | Value |
|---|---|
| `UPSC_TRACKER_KEYSTORE_B64` | the base64 output |
| `UPSC_TRACKER_KEYSTORE_PASSWORD` | keystore password |
| `UPSC_TRACKER_KEY_PASSWORD` | key password (the same value if you pressed Enter at that prompt) |

(In a **private** repo you may skip this: the first run creates a key with a random password and offers it as a 3-day `first-build-key` artifact to save as the three secrets.)

## 4. Build the APK
1. Repository **Settings > Secrets and variables > Actions > Variables**: create `SITE_URL` = your final Pages URL, e.g. `https://USER.github.io/` (the site must already be live).
2. **Actions > Build Android APK > Run workflow**.
3. Download artifact `upsc-tracker-apk`: `upsc-tracker.apk` (install on the phone) and `assetlinks.json`.

## 5. Digital Asset Links (removes the browser address bar inside the app)
Android checks `https://HOST/.well-known/assetlinks.json` at the **root of the host**. A project page (`USER.github.io/REPO/`) cannot serve that file; only a repository named exactly `USER.github.io` (or a custom domain) can. Recommended: name this repository `USER.github.io`, set `SITE_URL=https://USER.github.io/`, and commit the downloaded `assetlinks.json` to `.well-known/assetlinks.json` (the `.nojekyll` file already lets GitHub serve dot-folders). If you skip this step the app still works, but Chrome shows a thin address bar at the top.

## 6. First-run checklist on the phone
1. Open the installed app: Google login screen appears.
2. Continue with Google, choose your account: tracker opens, your Gmail is shown in the sidebar/menu.
3. Change something, close the app, reopen: still signed in, change is there.
4. Open the website on a computer with the same Google account: same data.
5. Sign out: login screen returns. Sign in again: data restored.

## Notes
- Earlier progress from the old username/password system is imported once, only into an account that has no data yet, and only after a successful cloud read. The old keys in the browser are never deleted. Anything else can be brought in with **Planner Setup > Import backup**.
- Console diagnostics (`FIREBASE AUTH READY`, `GOOGLE USER`, `FIREBASE UID`, `TRACKER FIRESTORE SAVE SUCCESS`, `GOOGLE LOGIN ERROR`, …) are kept on purpose. `testFirestore()` in the console runs a read/write check.
- The Test Center answer-key OCR button relies on a Claude-only feature and quietly does nothing outside claude.ai; manual answer keys are unaffected.
