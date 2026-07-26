#!/usr/bin/env bash
# Déploiement manuel de FreeHub sur O2Switch, depuis ton Mac.
#
#   ./deploy.sh            → envoie le code et redémarre l'app
#   ./deploy.sh --dry-run  → montre ce qui SERAIT envoyé, sans rien modifier
#
# Configuration : copie .deploy.env.exemple en .deploy.env et remplis-le.
# (.deploy.env n'est jamais commité ni déployé.)

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

echo "🔄 Redémarrage de l'application…"
ssh -p "$O2S_PORT" "$O2S_USER@$O2S_HOST" \
  "mkdir -p '$O2S_PATH/tmp' && touch '$O2S_PATH/tmp/restart.txt'"

echo "✅ Déployé. La base de production n'a pas été touchée."
