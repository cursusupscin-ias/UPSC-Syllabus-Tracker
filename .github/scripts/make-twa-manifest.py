#!/usr/bin/env python3
"""Generate twa-manifest.json for Bubblewrap from the production URL (no interactive prompts)."""
import json, os, re, sys
site = os.environ.get('SITE_URL', '').strip()
m = re.match(r'^https://([A-Za-z0-9.-]+)(/[^\s?#]*)?$', site)
if not m:
    sys.exit('SITE_URL must be the final https GitHub Pages URL, e.g. https://name.github.io/ or https://name.github.io/repo/')
host, path = m.group(1), (m.group(2) or '/')
if not path.endswith('/'): path += '/'
base = f'https://{host}{path}'
owner = re.sub(r'[^a-z0-9]', '', os.environ.get('OWNER', 'user').lower()) or 'user'
if owner[0].isdigit(): owner = 'u' + owner
pkg = os.environ.get('PACKAGE_ID') or f'io.github.{owner}.upsctracker'
run = os.environ.get('RUN_NUMBER', '1')
alias = os.environ.get('KEY_ALIAS', 'upsc-tracker')
dark = '#0A0A0A'
tm = {
  'packageId': pkg, 'host': host, 'name': 'Personal UPSC Tracker', 'launcherName': 'UPSC Tracker',
  'display': 'standalone', 'orientation': 'portrait',
  'themeColor': dark, 'themeColorDark': dark, 'navigationColor': dark, 'navigationColorDark': dark,
  'navigationDividerColor': dark, 'navigationDividerColorDark': dark, 'backgroundColor': dark,
  'enableNotifications': False, 'startUrl': path,
  'iconUrl': base + 'icon-512.png', 'maskableIconUrl': base + 'icon-maskable-512.png',
  'monochromeIconUrl': base + 'icon-monochrome.png',
  'splashScreenFadeOutDuration': 300,
  'signingKey': {'path': './release.keystore', 'alias': alias},
  'appVersionName': f'1.0.{run}', 'appVersion': run,
  'shortcuts': [], 'generatorApp': 'bubblewrap-cli', 'webManifestUrl': base + 'manifest.webmanifest',
  'fallbackType': 'customtabs', 'features': {}, 'alphaDependencies': {'enabled': False},
  'enableSiteSettingsShortcut': True, 'isChromeOSOnly': False, 'isMetaQuest': False,
  'fullScopeUrl': base, 'minSdkVersion': 21
}
os.makedirs('twa-build', exist_ok=True)
json.dump(tm, open('twa-build/twa-manifest.json', 'w'), indent=2)
print(f'twa-manifest.json written: package={pkg} host={host} startUrl={path}')
with open(os.environ.get('GITHUB_ENV', os.devnull), 'a') as f: f.write(f'PACKAGE_ID={pkg}\nSITE_HOST={host}\n')
