# Importe FastAPI, le "moteur" qui gere les routes de l'API
from fastapi import FastAPI
# Importe l'outil qui charge des modeles d'IA prets pour transformer du texte en embedding
from sentence_transformers import SentenceTransformer

# C'est comme un receptionniste : il attend chaque requete HTTP et decide quoi en faire
app = FastAPI()

# On l'allume une seule fois, comme une machine a cafe allumee le matin et gardee allumee toute la journee
model = SentenceTransformer('all-MiniLM-L6-v2')

# Definit la route que Laravel doit appeler pour demander un embedding
@app.post("/embedding")
# Reçoit le texte envoye par Laravel et le transforme en embedding
def gerar_embedding(dados: dict):
# Recupere le texte reçu de Laravel
    text = dados["texto"]

# Transforme le texte en vecteur (embedding)
    embedding = model.encode(text).tolist()

# Renvoie l'embedding en JSON
    return {"embedding": embedding}