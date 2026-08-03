#!/usr/bin/env bash
set -euo pipefail

rm -rf android resources dist
npm run prepare:android
npx cap add android

mkdir -p resources
cp assets/illustrations/ui/sidebar-avatar.png resources/logo.png
npx @capacitor/assets generate --android --assetPath resources \
  --iconBackgroundColor '#eef4ff' \
  --iconBackgroundColorDark '#17233f' \
  --splashBackgroundColor '#eef4ff' \
  --splashBackgroundColorDark '#17233f'

npx cap sync android
node scripts/prepare-android-identity.mjs

python - <<'PY'
import os
import re
from pathlib import Path

run_number = os.environ.get("GITHUB_RUN_NUMBER", "1")
gradle_file = Path("android/app/build.gradle")
text = gradle_file.read_text(encoding="utf-8")
updated = re.sub(r"versionCode\s+\d+", f"versionCode {run_number}", text, count=1)
updated = re.sub(r'versionName\s+"[^"]+"', f'versionName "1.0.{run_number}"', updated, count=1)
if updated == text:
    raise SystemExit("Android version fields were not found")
gradle_file.write_text(updated, encoding="utf-8")
PY

cd android
chmod +x gradlew
./gradlew assembleDebug --no-daemon --stacktrace
cd ..

mkdir -p dist
cp android/app/build/outputs/apk/debug/app-debug.apk "dist/Benny-Study-${GITHUB_RUN_NUMBER:-1}.apk"
sha256sum "dist/Benny-Study-${GITHUB_RUN_NUMBER:-1}.apk" > "dist/Benny-Study-${GITHUB_RUN_NUMBER:-1}.sha256"
