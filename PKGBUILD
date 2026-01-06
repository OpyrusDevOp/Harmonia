# Maintainer: OpyrusDevOps opyrusdeveloper@gmail.com
pkgname=harmonia
pkgver=1.1.93
pkgrel=1
pkgdesc="My Electron music player"
arch=('x86_64')
url="https://github.com/OpyrusDevOp/Harmonia"
license=('MIT')
depends=('gtk3' 'nss' 'alsa-lib' 'libxss' 'libxtst' 'mesa')
makedepends=('npm' 'nodejs' 'git')
optdepends=(
  'gstreamer: for media playback support'
)
provides=('harmonia')
conflicts=('harmonia-git')
source=("$pkgname-$pkgver.tar.gz::$url/archive/v$pkgver.tar.gz")
sha256sums=('430c20896e3691d994fb27d83c49ffb22d9ce06541370d60633b1afaf0b68449')

prepare() {
  # Adjust this if the extracted folder is named differently (e.g. Harmonia-v1.1.93)
  cd "$srcdir/Harmonia-$pkgver/src/harmonia"

  # Install dependencies
  npm ci --cache "${srcdir}/npm-cache"
}

build() {
  cd "$srcdir/Harmonia-$pkgver/src/harmonia"

  # Set environment variables for building
  export NODE_ENV=production
  export npm_config_cache="${srcdir}/npm-cache"
  # export npm_config_build_from_source=true

  # Build the application using electron-forge package
  # This creates a folder at out/harmonia-linux-x64
  npm run package
}

package() {
  cd "$srcdir/Harmonia-$pkgver/src/harmonia"

  # Create necessary directories
  install -dm755 "$pkgdir/usr/lib/$pkgname"
  install -dm755 "$pkgdir/usr/bin"
  install -dm755 "$pkgdir/usr/share/applications"
  install -dm755 "$pkgdir/usr/share/icons/hicolor/256x256/apps"
  install -dm755 "$pkgdir/usr/share/licenses/$pkgname"

  # Copy the packaged application
  # electron-forge package outputs to out/harmonia-linux-x64 by default
  if [ -d "out/harmonia-linux-x64" ]; then
    cp -r out/harmonia-linux-x64/* "$pkgdir/usr/lib/$pkgname/"
  else
    echo "Error: Could not find built application in out/harmonia-linux-x64"
    exit 1
  fi

  # Create launcher script that uses system electron
  # Create launcher script that uses system electron or the bundled one?
  # Since we are copying the full Electron build, we should execute the binary directly.
  # The binary name usually matches the productName or name in package.json.
  # Based on package.json, productName is "harmonia".
  cat >"$pkgdir/usr/bin/harmonia" <<EOF
#!/bin/bash
exec /usr/lib/harmonia/harmonia "\$@"
EOF
  chmod +x "$pkgdir/usr/bin/harmonia"

  # Install desktop file
  cat >"$pkgdir/usr/share/applications/harmonia.desktop" <<'EOF'
[Desktop Entry]
Name=Harmonia
Comment=My Electron music player
Exec=harmonia %U
Icon=harmonia
Type=Application
Categories=AudioVideo;Audio;Player;
MimeType=audio/mpeg;audio/mp4;audio/flac;audio/ogg;audio/wav;audio/m4a;audio/aac;
StartupNotify=true
StartupWMClass=harmonia
EOF

  # Install icon
  # Install icon configuration (if available in source)
  # From file list: src/assets/Harmonia.png (relative to src/harmonia) -> likely in src/assets
  # Wait, current dir is src/harmonia. So path is src/assets.
  # Checking list_dir output: src/harmonia/src follows.
  # Wait, list_dir of src/harmonia shows a 'src' subdir.
  # So icon path is likely "src/assets/Harmonia.png" inside "src/harmonia".
  
  if [ -f "src/assets/Harmonia.png" ]; then
    install -Dm644 "src/assets/Harmonia.png" "$pkgdir/usr/share/icons/hicolor/256x256/apps/harmonia.png"
  fi
  
  # Install license (from root directory, which is two levels up from src/harmonia)
  if [ -f "../../LICENSE" ]; then
    install -Dm644 "../../LICENSE" "$pkgdir/usr/share/licenses/$pkgname/LICENSE"
  fi

  # Install documentation (from root directory)
  if [ -f "../../README.md" ]; then
    install -Dm644 "../../README.md" "$pkgdir/usr/share/doc/$pkgname/README.md"
  fi
}
