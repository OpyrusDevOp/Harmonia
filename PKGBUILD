# Maintainer: OpyrusDevOps opyrusdeveloper@gmail.com
pkgname=harmonia
pkgver=1.1.93
pkgrel=1
pkgdesc="My Electron music player"
arch=('x86_64')
url="https://github.com/OpyrusDevOp/Harmonia"
license=('MIT')
depends=('dpkg' 'fakeroot')
makedepends=('npm' 'nodejs' 'git')
optdepends=(
  'gstreamer: for media playback support'
)
provides=('harmonia')
conflicts=('harmonia-git')
source=("$pkgname-$pkgver.tar.gz::$url/archive/v$pkgver.tar.gz")
sha256sums=('SKIP')

prepare() {
  cd "$srcdir/harmonia"

  # Install dependencies
  npm ci --cache "${srcdir}/npm-cache"
}

build() {
  cd "$srcdir/harmonia"

  # Set environment variables for building
  export NODE_ENV=production
  export npm_config_cache="${srcdir}/npm-cache"
  export npm_config_build_from_source=true

  # Build the application using electron-forge
  npm run make
}

package() {
  cd "$srcdir/harmonia"

  # Create necessary directories
  install -dm755 "$pkgdir/usr/lib/$pkgname"
  install -dm755 "$pkgdir/usr/bin"
  install -dm755 "$pkgdir/usr/share/applications"
  install -dm755 "$pkgdir/usr/share/icons/hicolor/256x256/apps"
  install -dm755 "$pkgdir/usr/share/licenses/$pkgname"

  # Find the built application (electron-forge creates different output structures)
  if [ -d "out/harmonia-linux-x64" ]; then
    # Standard electron-forge output
    cp -r out/harmonia-linux-x64/* "$pkgdir/usr/lib/$pkgname/"
  elif [ -d "out/make/deb/x64" ]; then
    # Debian maker output
    find out/make/deb/x64 -name "*.deb" -exec dpkg-deb -x {} "$pkgdir/usr/lib/$pkgname/" \;
  elif [ -d "out/make/zip/linux/x64" ]; then
    # ZIP maker output
    unzip -q out/make/zip/linux/x64/*.zip -d "$pkgdir/usr/lib/"
    mv "$pkgdir/usr/lib/harmonia-linux-x64"/* "$pkgdir/usr/lib/$pkgname/"
    rmdir "$pkgdir/usr/lib/harmonia-linux-x64"
  else
    echo "Error: Could not find built application"
    exit 1
  fi

  # Create launcher script that uses system electron
  cat >"$pkgdir/usr/bin/harmonia" <<'EOF'
#!/bin/bash
exec /usr/lib/harmonia
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
  if [ -f "src/assets/Harmonia.png" ]; then
    install -Dm644 "src/assets/Harmonia.png" "$pkgdir/usr/share/icons/hicolor/256x256/apps/harmonia.png"
  fi
  #
  # # Install license (from root directory)
  # if [ -f "../../LICENSE" ]; then
  #   install -Dm644 "../../LICENSE" "$pkgdir/usr/share/licenses/$pkgname/LICENSE"
  # fi
  #
  # # Install documentation (from root directory)
  # if [ -f "../../README.md" ]; then
  #   install -Dm644 "../../README.md" "$pkgdir/usr/share/doc/$pkgname/README.md"
  # fi
}
