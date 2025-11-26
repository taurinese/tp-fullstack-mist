# On part d'une version légère de Node
FROM node:22-alpine

# On crée un dossier de travail dans le conteneur
WORKDIR /app

# On copie d'abord les dépendances (pour le cache Docker)
COPY package*.json ./

# On installe les dépendances
RUN npm install

# On copie tout le reste du code
COPY . .

# On expose le port (Docker le notera, mais c'est docker-compose qui décide vraiment)
# Note: Ce n'est pas grave si le port diffère selon le service, cette ligne est indicative
EXPOSE 3000

# La commande de démarrage
CMD ["npm", "start"]