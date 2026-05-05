# Simple Crew Orchestrator

Ce projet est un framework léger codé en Node.js en vue d'orchestrer des agents IA autonomes capables d'utiliser des outils réels comme des APIs ou la gestion de système de fichiers et d'automatiser des tâches.


## 1. Introduction 

### 1.1. différence entre une IA classique et un Agent:

- **L'IA classique** génère du texte seulement
- **L'Agent IA** utilise des outils pour exécuter du code comme envoyer un email, chercher sur le web ou générer un fichier


### 1.2. Inspirations du projet

Ce projet s'inspire de concepts comme CrewAI (Python) ou n8n mais implémenté de manière minimaliste en JavaScript

- **Approche équipe de CrewAI**: faire collaborer plusieurs agents en ligne de commande (CLI)
- **Approche flux de n8n** : automatiser des actions logiques avec une interface graphique


## 2. Objectif du projet

Créer une équipe d'agents capables de travailler à la chaîne, par exemple : 
1. **Agent source**  qui récupère des données météo via API
2. **Agent rédacteur** qui transforme les données brutes en bulletin météo ou article de blog
3. **Agent archiveur** : qui sauvegarde le résultat final dans un fichier local.

Ce projet propose d'abord une version Console (CLI) puis une version Interface Graphique (GUI) via Express.


## 3. Configuration Technique

### 3.1. Pré-requis 

- Node.js (v18+) et npm 
- VS Code
- LM Studio en local 

- Applications en ligne similaires à LM Studio: [Ollama](https://ollama.com/) ou [Groq](https://console.groq.com/home)
-> créer un compte gratuit et récupérer les clés d'API, port différent

### 3.2. Installer les dépendances npm (dans package.json) 

```
npm i dotenv
npm i express (ordi devient comme serveur web)
npm i node-fetch (récup data de l'API)
```

### 3.3. Récupérer le projet 

- Cloner le projet 
- Exécuter `npm install`
- Créer un fichier `.env` à la racine du projet


## 4. Configuration de l'IA (LM Studio)

### 4.1. Télécharger un modèle (ex: Llama 3.1 8B Instruct ou Llama 3.2 3B)

- se mettre en "mode developer"
- search (loupe) le modele (chiffre suivi de B: nb de milliards de param que model dispose -> on reste jusqu'à 8b max)
-> 1. model: Llama 3.1.8B instruct (entrainé pour suivre instructions) -> fusée verte à droite si le model est compatible 
 recommandé K4.S mais mieux Q4.M -> download
-> 2. sinon : Llama 3.2.3B instruct 
-> 3. sinon : Llama-3.2-1B-Instruct-GGUF
- Ejecter le modele pur ne pas consommer trop puissance de l'ordi, aller dans API (à gauche menu Developer) 

### 4.2. Dans l'onglet AI Server :

Avce le switch: 
- activer le serveur "status running"
- activer l'option CORS dans "settings"
- charger le model Llama 3 8B instruct au milieu 

### 4.3. Copier les infos dans le .env

- Copier à droite : route de l'API et nom modele dans .env: paste : 
```
LM_API_URL=http://127.0.0.1:1234/v1/chat/completions
LM_MODEL=meta-llama-3.1-8b-instruct
```
En dessous: routes qui nous interesse: `POST/v1/chat/completions`
LM studio doit tourner avec l'API en arriere plan 


## 5. Architecture du projet 

### 5.1. Le cœur du système repose sur 3 classes dans `core.js`: 

- **Tool**: outil pour définir une action concrète comme faire un appel API ou écrire dnas un fichier
- **Agent**: agent AI qui réfléchit et décide quel outil utiliser
- **Task**: tâche précise confiée à l'agent IA

### 5.2. Organisation des fichiers:

- **core.js**: classes de base (moteur)
- **tools.js**: les outils disponibles
- **MyCrewDemo.js**: le chef d'orchestre qui crée les agents et lance les tâches




