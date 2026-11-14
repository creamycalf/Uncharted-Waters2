#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MOBILE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ROOT_DIR="$(cd "$MOBILE_DIR/.." && pwd)"
APK_INPUT="$ROOT_DIR/Uncharted-Waters-2-Android-v7.8.apk"
INSPECTION="$ROOT_DIR/inspection"
ASSET_ROOT="$MOBILE_DIR/assets"
BUILD_DIR="$MOBILE_DIR/build"
OUTPUT_DIR="$ROOT_DIR/dist"

if [[ ! -f "$APK_INPUT" ]]; then
  echo "Missing base APK: $APK_INPUT" >&2
  exit 1
fi

python3 - "$APK_INPUT" <<'PY'
import hashlib
import sys
from pathlib import Path

apk = Path(sys.argv[1])
expected = "3e86265e77e7f65de02f892a4d774f1928b5dff9a7e46028fa0adf740e3d5e3c"
actual = hashlib.sha256(apk.read_bytes()).hexdigest()
if actual != expected:
    raise SystemExit(f"Unexpected v7.8 APK SHA-256: {actual}")
print("Base APK SHA-256 verified.")
PY

mkdir -p "$INSPECTION" "$INSPECTION/game-check" "$OUTPUT_DIR"
if [[ ! -f "$INSPECTION/assets/web/index.html" ]]; then
  unzip -oq "$APK_INPUT" 'assets/*' -d "$INSPECTION"
fi
if [[ ! -f "$ASSET_ROOT/web/index.html" ]]; then
  cp -R "$INSPECTION/assets" "$ASSET_ROOT"
fi
unzip -oq "$INSPECTION/assets/web/game/bundle.zip" MAIN.EXE KOUKAI2.DAT -d "$INSPECTION/game-check"
cp "$INSPECTION/game-check/MAIN.EXE" "$ASSET_ROOT/web/game/MAIN.original.EXE"
mkdir -p "$ASSET_ROOT/release-docs"
cp "$MOBILE_DIR/licenses/JohanLi-MIT.txt" "$ASSET_ROOT/release-docs/JohanLi-MIT.txt"
cp "$MOBILE_DIR/licenses/genishs-MIT.txt" "$ASSET_ROOT/release-docs/genishs-MIT.txt"
mkdir -p "$ASSET_ROOT/release-docs/licenses"
cp "$ROOT_DIR/docs/upstream/licenses/GPL-2.0.txt" "$ASSET_ROOT/release-docs/licenses/GPL-2.0.txt"
# Optional, user-supplied upstream v8.9 APK contains the chart projection.
# Never copy the APK or the artwork into version control.
python3 - "$ASSET_ROOT/web/world-projection.json" "${UW2_V89_APK:-}" "${UW2_WORLD_PROJECTION:-}" <<'PYCODE'
import hashlib, sys, zipfile
from pathlib import Path
out=Path(sys.argv[1]); source=sys.argv[2]; projection=sys.argv[3]
if source:
    apk=Path(source)
    if hashlib.sha256(apk.read_bytes()).hexdigest() != "a26bb6a1265bd715842f7c9f70315ed35141f06869954002bf7ccf0052e34f94":
        raise SystemExit("Unexpected v8.9 APK hash; chart projection was not imported.")
    with zipfile.ZipFile(apk) as z: data=z.read("assets/web/world-projection.json")
elif projection:
    data=Path(projection).read_bytes()
else:
    out.unlink(missing_ok=True)
    print("No chart projection supplied; chart falls back to coordinate grid.")
    sys.exit(0)
if hashlib.sha256(data).hexdigest() != "e166c3d5f02bbe970ce4c1d038e6b3271fb721af12e6fbd66aba536540182a75":
    raise SystemExit("Unexpected chart projection hash.")
out.write_bytes(data)
print("Verified v8.9 chart projection imported.")
PYCODE
node "$SCRIPT_DIR/prepare.cjs"

SDK_ROOT="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-$HOME/Library/Android/sdk}}"
JDK_ROOT="${JAVA_HOME:-/Applications/Android Studio.app/Contents/jbr/Contents/Home}"
BUILD_TOOLS_VERSION="${ANDROID_BUILD_TOOLS_VERSION:-36.0.0}"
BUILD_TOOLS="$SDK_ROOT/build-tools/$BUILD_TOOLS_VERSION"

if [[ ! -x "$JDK_ROOT/bin/java" || ! -x "$JDK_ROOT/bin/javac" ]]; then
  echo "JDK not found at $JDK_ROOT; set JAVA_HOME to JDK 21 or newer." >&2
  exit 1
fi

PLATFORM_DIR="${ANDROID_PLATFORM_DIR:-}"
if [[ -z "$PLATFORM_DIR" ]]; then
  for candidate in android-36 android-37 android-37.0; do
    if [[ -f "$SDK_ROOT/platforms/$candidate/android.jar" ]]; then
      PLATFORM_DIR="$SDK_ROOT/platforms/$candidate"
      break
    fi
  done
fi
if [[ -z "$PLATFORM_DIR" || ! -f "$PLATFORM_DIR/android.jar" ]]; then
  echo "Android SDK platform 36 or newer not found under $SDK_ROOT/platforms." >&2
  exit 1
fi

for tool in aapt2 zipalign; do
  if [[ ! -x "$BUILD_TOOLS/$tool" ]]; then
    echo "Missing Android build tool: $BUILD_TOOLS/$tool" >&2
    exit 1
  fi
done

rm -rf "$BUILD_DIR/classes" "$BUILD_DIR/dex"
rm -f "$BUILD_DIR/compiled-res.zip" "$BUILD_DIR/unsigned.apk" "$BUILD_DIR/aligned.apk"
mkdir -p "$BUILD_DIR/classes" "$BUILD_DIR/dex"
"$BUILD_TOOLS/aapt2" compile --dir "$MOBILE_DIR/android/res" -o "$BUILD_DIR/compiled-res.zip"
"$BUILD_TOOLS/aapt2" link -o "$BUILD_DIR/unsigned.apk" \
  --manifest "$MOBILE_DIR/android/AndroidManifest.xml" \
  -I "$PLATFORM_DIR/android.jar" "$BUILD_DIR/compiled-res.zip"
"$JDK_ROOT/bin/javac" -encoding UTF-8 -source 8 -target 8 \
  -classpath "$PLATFORM_DIR/android.jar" -d "$BUILD_DIR/classes" \
  "$MOBILE_DIR/android/MainActivity.java"
"$JDK_ROOT/bin/jar" cf "$BUILD_DIR/classes.jar" -C "$BUILD_DIR/classes" .
"$JDK_ROOT/bin/java" -cp "$BUILD_TOOLS/lib/d8.jar" com.android.tools.r8.D8 \
  --lib "$PLATFORM_DIR/android.jar" --min-api 26 \
  --output "$BUILD_DIR/dex" "$BUILD_DIR/classes.jar"

python3 - "$BUILD_DIR/unsigned.apk" "$BUILD_DIR/dex/classes.dex" "$ASSET_ROOT" <<'PY'
import sys
import zipfile
from pathlib import Path

apk, dex, assets = map(Path, sys.argv[1:])
with zipfile.ZipFile(apk, "a", compression=zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
    existing = set(archive.namelist())
    additions = [(dex, "classes.dex")]
    additions.extend((p, "assets/" + p.relative_to(assets).as_posix())
                     for p in assets.rglob("*") if p.is_file())
    for source, name in additions:
        if name in existing:
            raise SystemExit(f"Duplicate APK path: {name}")
        archive.write(source, name)
        existing.add(name)
print(f"Added DEX and {sum(name.startswith('assets/') for _, name in additions)} assets.")
PY

"$BUILD_TOOLS/zipalign" -f 4 "$BUILD_DIR/unsigned.apk" "$BUILD_DIR/aligned.apk"
KEYSTORE="$BUILD_DIR/local-test.jks"
if [[ ! -f "$KEYSTORE" ]]; then
  "$JDK_ROOT/bin/keytool" -genkeypair -keystore "$KEYSTORE" \
    -storepass android -keypass android -alias local-test -keyalg RSA \
    -keysize 2048 -validity 3650 -dname "CN=UW2 Local Input Test"
fi
OUTPUT_APK="$OUTPUT_DIR/Uncharted-Waters-2-Mobile-0.9.16-input-test.apk"
"$JDK_ROOT/bin/java" -jar "$BUILD_TOOLS/lib/apksigner.jar" sign \
  --ks "$KEYSTORE" --ks-pass pass:android --key-pass pass:android \
  --out "$OUTPUT_APK" "$BUILD_DIR/aligned.apk"
"$JDK_ROOT/bin/java" -jar "$BUILD_TOOLS/lib/apksigner.jar" verify --verbose "$OUTPUT_APK"
echo "Built $OUTPUT_APK"
