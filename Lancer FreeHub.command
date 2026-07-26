#!/bin/bash
# Double-clique sur ce fichier pour lancer FreeHub.
# Laisse cette fenêtre ouverte tant que tu utilises l'app. Pour arrêter : Ctrl + C.

cd "$(dirname "$0")" || exit 1

# Première utilisation : installe l'environnement automatiquement.
if [ ! -x ".venv/bin/python" ]; then
  echo "Première installation (environ 1 minute)…"
  python3 -m venv .venv || { echo "Python 3 est introuvable."; read -r; exit 1; }
  ./.venv/bin/pip install --quiet --upgrade pip
  ./.venv/bin/pip install --quiet -r requirements.txt || { echo "Installation impossible."; read -r; exit 1; }
fi

echo ""
echo "  FreeHub démarre…  →  http://localhost:8123"
echo "  Pour arrêter : Ctrl + C"
echo ""

# Ouvre le navigateur une fois le serveur prêt.
( sleep 2 && open "http://localhost:8123" ) &

./.venv/bin/python server.py
