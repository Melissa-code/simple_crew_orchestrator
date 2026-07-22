# Guide d'utilisation de Simple Crew Orchestrator 

## Vue d'ensemble

Simple Crew Orchestrator est une interface visuelle permettant de créer et 
d'exécuter des workflows d'IA en connectant des agents et des tâches. 
Chaque agent peut utiliser différents outils pour accomplir des tâches spécifiques.


## Types de blocs

### Agents IA
Les agents sont des entités IA qui exécutent des tâches en utilisant des outils spécialisés.

**Configuration :**
- **Nom** : identifiant unique de l'agent
- **Outils** : outil principal que l'agent peut utiliser
- **Prompt** : instructions système pour guider le comportement de l'agent

### Tâches
Les tâches définissent les actions à effectuer par les agents.

**Configuration :**
- **Tool** : outil spécifique à utiliser pour cette tâche
- **Paramètres** : variables selon l'outil sélectionné

## Outils disponibles

### LM Studio
**Utilisation :** génération de texte par IA

**Paramètres :**
- **Prompt/Input** : instructions ou question à poser à l'IA

**Exemple d'usage :**
```
Analyse ces données et donne un conseil 
```

### Fetch
**Utilisation :** récupération de contenu web

**Paramètres :**
- **URL** : adresse web à récupérer

**Exemple d'usage :**
```
https://example.com/api/data
```

### Weather
**Utilisation :** données météorologiques

**Paramètres :**
- **Ville** : nom de la ville

**Exemple d'usage :**
```
Paris
```

### Write File
**Utilisation :** écriture de fichiers

**Paramètres :**
- **Nom du fichier** : nom du fichier de sortie

**Exemple d'usage :**
```
result.md
```

## Connexions entre blocs

- **Point de sortie** (droite) : Connectez depuis ce point
- **Point d'entrée** (gauche) : Connectez vers ce point
- Les résultats se transmettent automatiquement entre les tâches connectées

## Injection automatique

### Pour LM Studio :
Le résultat de la tâche précédente est ajouté au prompt :
```
Votre prompt + "\n\nRésultat précédent: [résultat]"
```

### Pour Append Analysis :
Le champ "Contenu" est automatiquement rempli avec le résultat de la tâche précédente.

### Pour Write File :
Le contenu du fichier est remplacé par le résultat de la tâche précédente.

## Conseils d'utilisation

### ✅ Bonnes pratiques
- Utilisez des prompts clairs et spécifiques
- Connectez les tâches dans un ordre logique
- Testez avec des données simples d'abord

### ❌ À éviter
- Prompts trop génériques
- Cycles de connexions infinies
- Oubli des paramètres obligatoires

## Actions de l'interface

### Exécuter
Lance l'exécution du workflow en séquence

### Effacer
Supprime tous les blocs du workspace

### Sauvegarder
Exporte le workflow en fichier JSON

### Charger
Importe un workflow depuis un fichier JSON

### Console
Affiche les logs d'exécution en temps réel

## Codes d'erreur courants

- **"URL manquante"** : URL requise pour Fetch
- **"Ville manquante"** : ville requise pour Weather
- **"Tool not found"** : outil non disponible pour l'agent

## Support

Pour plus d'aide, vérifiez :
1. Les paramètres de vos blocs
2. Les connexions entre les tâches
3. Les logs dans la console
4. Les exemples dans le dossier `/examples`
