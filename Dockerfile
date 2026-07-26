# Image de production FreeHub — FastAPI + SQLite, servie par uvicorn.
FROM python:3.12-slim

WORKDIR /app

# Dépendances d'abord (cache Docker : ne réinstalle que si requirements.txt change).
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Le reste du projet (server.py, index.html, assets/…).
COPY . .

# 0.0.0.0 pour être joignable depuis l'extérieur du conteneur ; la base vit sur
# le volume persistant monté en /data (voir fly.toml).
ENV HOST=0.0.0.0 \
    PORT=8080 \
    FH_DATA_DIR=/data

EXPOSE 8080

CMD ["python", "server.py"]
