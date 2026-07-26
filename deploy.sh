#!/usr/bin/env bash
# Déploiement manuel de FreeHub sur O2Switch, depuis ton Mac.
# (Secours : le déploiement normal passe par GitHub Actions à chaque push.)
#
#   ./deploy.sh            → envoie le code puis vérifie l'API
#   ./deploy.sh --dry-run  → montre ce qui SERAIT envoyé, sans rien modifier
#
# Configuration : copie .deploy.env.exemple en .deploy.env et remplis-le.

set -euo pipefail
cd "$(dirname "$0")"

if [ ! -f .deploy.env ]; then
  echo "❌ Fichier .deploy.env manquant."
  echo "   Copie .deploy.env.exemple en .deploy.env et renseigne tes accès O2Switch."
  exit 1
fi
# shellcheck disable=SC1091
source .deploy.env

: "${O2S_HOST:?Renseigne O2S_HOST dans .deploy.env}"
: "${O2S_USER:?Renseigne O2S_USER dans .deploy.env}"
: "${O2S_PATH:?Renseigne O2S_PATH dans .deploy.env}"
O2S_PORT="${O2S_PORT:-22}"

SEC=""
if [ "${1:-}" = "--dry-run" ]; then
  SEC="--dry-run"
  echo "🔍 Simulation — aucun fichier ne sera modifié."
fi

echo "📦 Envoi vers $O2S_USER@$O2S_HOST:$O2S_PATH"
rsync -az --delete $SEC --exclude-from=.deployignore \
  -e "ssh -p $O2S_PORT" \
  ./ "$O2S_USER@$O2S_HOST:$O2S_PATH/"

if [ -n "$SEC" ]; then
  echo "🔍 Simulation terminée."
  exit 0
fi

# PHP est servi nativement : rien à redémarrer. On vérifie juste que l'API répond.
echo "🩺 Contrôle de santé…"
if curl -s --max-time 15 "https://free-hub.fr/api/ping" | grep -q '"ok":true'; then
  echo "✅ Déployé et vérifié. Les données de production n'ont pas été touchées."
else
  echo "⚠️ Déployé, mais l'API ne répond pas — vérifier https://free-hub.fr/api/ping"
  exit 1
fi
