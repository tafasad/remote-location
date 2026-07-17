#!/data/data/com.termux/files/usr/bin/bash
set -e
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'
clear
echo -e "${CYAN}========================================"
echo -e "        INSTALADOR NEXUS - TERMUX"
echo -e "========================================${NC}"
echo ""
echo -e "${CYAN}[1/3] Verificando dependencias...${NC}"
pkg update -y && pkg install git python nodejs-lts -y
echo ""
echo -e "${CYAN}[2/3] Clonando repositorio...${NC}"
if [ ! -d nexus-app ]; then
    git clone https://github.com/tafasad/nexus-desktop.git nexus-app
fi
cd nexus-app
echo ""
echo -e "${CYAN}[3/3] Instalando dependencias...${NC}"
pip install --upgrade pip
pip install customtkinter cryptography pillow paho-mqtt requests aiortc geocoder sounddevice numpy scipy 2>/dev/null || pip install customtkinter cryptography pillow paho-mqtt requests requests sounddevice numpy
echo ""
echo -e "${GREEN}========================================"
echo -e "   INSTALACAO COMPLETA!"
echo -e "   Execute: python3 nexus_app.py"
echo -e "========================================${NC}"
