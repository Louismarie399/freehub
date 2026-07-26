# Point d'entrée pour l'hébergement O2Switch (cPanel « Setup Python App » → Passenger).
#
# Passenger attend une application *WSGI* exposée sous le nom `application`.
# FastAPI est *ASGI* : on fait le pont avec a2wsgi.
#
# En local ou sur un hébergeur ASGI (uvicorn), ce fichier est simplement ignoré.
from server import app
from a2wsgi import ASGIMiddleware

application = ASGIMiddleware(app)
