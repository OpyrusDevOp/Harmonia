#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting Harmonia installation...${NC}"

# Check for Arch Linux
if [ -f "/etc/arch-release" ]; then
    echo -e "${GREEN}Arch Linux detected.${NC}"
    if [ -f "PKGBUILD" ]; then
        echo -e "${BLUE}Found PKGBUILD. Attempting to build and install with makepkg...${NC}"
        
        # Check if sources are available (remote tarball)
        # Assuming the user wants to install the current LOCAL version if on dev branch
        # But PKGBUILD points to remote.
        # We will just run makepkg -si
        
        makepkg -si
        
        echo -e "${GREEN}Installation complete via makepkg!${NC}"
        exit 0
    else
        echo -e "${RED}PKGBUILD not found in current directory.${NC}"
    fi
fi

# Fallback / Generic Install
echo -e "${BLUE}Performing manual build and install (Generic Linux)...${NC}"

APP_DIR="src/harmonia"
BUILD_DIR="$APP_DIR/out/harmonia-linux-x64"
INSTALL_LIB="/usr/lib/harmonia"
INSTALL_BIN="/usr/bin/harmonia"
INSTALL_DESKTOP="/usr/share/applications/harmonia.desktop"
INSTALL_ICON="/usr/share/icons/hicolor/256x256/apps/harmonia.png"

# Check if we are in root
if [ ! -d "$APP_DIR" ]; then
    echo -e "${RED}Error: Could not find $APP_DIR. Please run this script from the project root.${NC}"
    exit 1
fi

# Build
echo -e "${BLUE}Building application...${NC}"
cd "$APP_DIR"
npm install
npm run package
cd ../..

# Install
if [ ! -d "$BUILD_DIR" ]; then
    echo -e "${RED}Error: Build failed. Directory $BUILD_DIR not found.${NC}"
    exit 1
fi

echo -e "${BLUE}Installing to system (requires sudo)...${NC}"

# Remove old install
if [ -d "$INSTALL_LIB" ]; then
    echo "Removing existing installation..."
    sudo rm -rf "$INSTALL_LIB"
fi

# Copy files
sudo mkdir -p "$INSTALL_LIB"
sudo cp -r "$BUILD_DIR/"* "$INSTALL_LIB/"

# Create launcher
echo "Creating launcher..."
sudo bash -c "cat > $INSTALL_BIN" <<EOF
#!/bin/bash
exec $INSTALL_LIB/harmonia "\$@"
EOF
sudo chmod +x "$INSTALL_BIN"

# Install Desktop File
echo "Installing desktop entry..."
sudo bash -c "cat > $INSTALL_DESKTOP" <<EOF
[Desktop Entry]
Name=Harmonia
Comment=My Electron music player
Exec=harmonia %U
Icon=harmonia
Type=Application
Categories=AudioVideo;Audio;Player;
StartupNotify=true
StartupWMClass=harmonia
EOF

# Install Icon
if [ -f "src/harmonia/src/assets/Harmonia.png" ]; then
    echo "Installing icon..."
    sudo mkdir -p "$(dirname "$INSTALL_ICON")"
    sudo cp "src/harmonia/src/assets/Harmonia.png" "$INSTALL_ICON"
fi

echo -e "${GREEN}Harmonia has been manually installed!${NC}"
echo "You can launch it by typing 'harmonia' in your terminal."
