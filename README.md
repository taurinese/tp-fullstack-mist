# TP Fullstack - Mist project

[![MIST Project](https://img.shields.io/badge/MIST_Project-Fullstack_Microservices-blue)](https://github.com/taurinese/tp-fullstack-mist)

## 📜 Explications du projet

**Mist** est une application web conçue pour résoudre la fragmentation du jeu vidéo sur PC. Elle agit comme un **Méta-Catalogue** centralisant vos bibliothèques, vos envies d'achat et le lancement de vos jeux, le tout depuis votre navigateur desktop.

### 🎯 Le problème

Aujourd'hui, un joueur PC doit jongler entre **Steam, Epic Games, GOG, Battle.net** et ses émulateurs. Résultat : des jeux oubliés, des achats en double, et une perte de temps à chercher où lancer tel ou tel jeu.

### 💡 La solution Mist

Mist est une plateforme centralisée qui résout la fragmentation des lanceurs PC (Steam, Epic, GOG...).

- **📚 Bibliothèque Unifiée** : Importez vos jeux depuis Steam ou ajoutez-les manuellement pour tout gérer au même endroit.
- **💰 Comparateur de Prix** : Visualisez en temps réel les meilleurs prix du marché pour chaque jeu avant d'acheter.
- **🚀 Hub de Lancement** : Lancez vos jeux directement depuis l'interface web via les protocoles natifs.

### ✨ Fonctionnalités clés

- **✅ Authentification Sécurisée** : Inscription, connexion, déconnexion avec HttpOnly Cookies.
- **✅ Catalogue de Jeux Dynamique** : Parcourez les jeux, utilisez les filtres, et comparez les prix en temps réel.
- **✅ Gestion de Bibliothèque** : Suivez votre collection, classez vos jeux par statut (à jouer, terminé, etc.).
- **🚧 Importation Steam** : Importer automatiquement vos jeux depuis votre compte Steam (en cours).
- **🚧 Lancement Direct des Jeux** : Lancer vos jeux installés depuis l'interface web (à venir).

---

## 🗺️ Schéma d'architecture détaillé

![Schéma d'Architecture de Mist](./docs/schema-mist.png)

1. **Zone publique**:

- Browser: pour que l'utilisateur accède à l'application web
- Frontend: Conteneur Docker avec Vite + React + TypeScript
- API Gateway : Conteneur Docker avec NodeJS + Express + http-proxy-middleware. Gère le routage et redirige les requêtes vers le bon microservice

2. **Zone Services**:

- Import Service (port 3003): Gère la communication avec les API externes (CheapShark, Steam...) pour importer les données de jeux et prix
- Store Service (port 3001): Gère le catalogue public de jeux-vidéo, contient un cache interne des prix
- Library Service (port 3002): Gère la collection personnelle de jeux-vidéo (achetés/possédés)
- User Service (port 3004): Gère l'authentification et les comptes utilisateurs

3. **Zone Bases de données**:

- MongoDB (port 27017): Utilisé par le Store Service, choisi pour la flexibilité des fiches de jeux-vidéo
- PostgreSQL (port 5432): Héberge deux bases logiques distinctes (mist_user & mist_library), choisi pour garantir l'intégrité des données relationnelles (utilisateurs, bibliothèques)

4. **Flux spécifiques**:

- StoreService -> ImportService: Le StoreService interroge l'ImportService pour actualiser les prix des jeux
- ImportService -> API externe (CheapShark): permet de récupérer les données de jeux et les différents prix

---

## ⚙️ Explications des choix techniques

L'architecture de **Mist** a été conçue pour répondre aux problèmes spécifiques d'agrégation de données et de fiabilité.

### 1. Gestion des Données (Le choix du "Polyglot Persistence")

Nous avons délibérément choisi d'utiliser deux technologies de base de données différentes pour répondre aux besoins opposés de nos services :

- **MongoDB (pour le Store Service)** :

  - **Le Défi** : Mist agrège des données de jeux provenant de sources multiples (Steam, GOG, Epic) qui n'ont pas la même structure (certains ont des trophées, d'autres non).
  - **La Solution** : L'approche orientée **Documents (JSON)** de MongoDB nous permet de stocker ces fiches de jeux hétérogènes sans imposer un schéma rigide qui nécessiterait de nombreuses colonnes vides (`NULL`) dans une base SQL classique.

- **PostgreSQL (pour le User & Library Service)** :
  - **Le Défi** : La relation entre un utilisateur et ses achats est critique. Il est interdit qu'un achat existe sans propriétaire ou qu'un doublon soit créé.
  - **La Solution** : Nous utilisons la **rigueur relationnelle (ACID)** de PostgreSQL. Les contraintes de clés étrangères garantissent que la suppression d'un utilisateur entraîne automatiquement le nettoyage de sa bibliothèque (Cascade), assurant une intégrité des données parfaite.

### 2. Découpage des Responsabilités (Microservices)

L'architecture est divisée pour isoler les risques techniques liés aux APIs externes :

- **Isolation de l'Import Service** : L'interaction avec les APIs tierces (CheapShark, Steam) est la partie la plus instable de l'application (latence réseau, quotas d'API, erreurs externes).
- **Avantage pour Mist** : En plaçant cette logique dans un service "Worker" dédié (`import-service`), une panne de l'API CheapShark ne fait pas planter le reste de l'application. L'utilisateur peut toujours se connecter (`user-service`) et consulter ses jeux déjà possédés (`library-service`) même si le comparateur de prix est temporairement indisponible.

### 3. Rôle de l'API Gateway

Au-delà du routage standard, la Gateway simplifie drastiquement le développement du Frontend :

- **Unification** : Le client React n'a pas besoin de connaître la topologie du réseau Docker ni les ports des 4 services (`3001`, `3002`, etc.). Il s'adresse à une interface unique (`/api/...`).
- **Abstraction** : Elle masque la complexité de l'infrastructure sous-jacente et centralise la gestion des headers de sécurité (CORS).

### 4. Sécurité et Typage (Frontend)

- **TypeScript (Contrat d'interface)** : Avec des objets métiers complexes comme `Game` ou `UserProfile`, le typage strict garantit que le Frontend consomme exactement ce que le Backend envoie. Cela évite les erreurs d'exécution si le format des données de l'API évolue.
- **HttpOnly Cookies** : Pour l'authentification, nous avons banni le stockage dans le `localStorage`. L'utilisation de cookies `HttpOnly` rend le token JWT totalement inaccessible au JavaScript client, protégeant ainsi les sessions utilisateurs contre les failles XSS (Cross-Site Scripting).

---

## 🚀 Installation et démarrage

Le projet est entièrement conteneurisé avec Docker.

### ✅ Prérequis

- **Docker** et **Docker Compose** installés.

### ▶️ Lancement rapide

1. **Configurer l'environnement** <br>
   Copiez le fichier d'exemple pour créer votre configuration locale :

   ```bash
   cp .env.example .env
   ```

2. **Démarrer la stack** <br>
   Compilez et lancez les conteneurs en arrière-plan :

   ```bash
   docker-compose up -d --build
   ```

3. **Accéder à l'application**
   - **Frontend** : [http://localhost:8080](http://localhost:8080)
   - **API Gateway** : [http://localhost:3000](http://localhost:3000)

### ⚡️ Tester l'API rapidement

Une fois la stack lancée, vous pouvez tester les routes principales directement depuis votre navigateur ou via `curl` :

- **Documentation Swagger (Tous les services)** :
  [http://localhost:3000/docs](http://localhost:3000/docs) (Le moyen le plus simple pour explorer)

- **Store Service (Catalogue)** :
  [http://localhost:3000/api/store](http://localhost:3000/api/store)

- **User Service (Test Auth)** :
  `POST http://localhost:3000/api/user/register` (Voir Swagger pour le payload)

- **Frontend (Interface complète)** :
  [http://localhost:8080](http://localhost:8080)

---
