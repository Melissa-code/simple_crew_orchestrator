// comment utiliser l'outil pour créer équipe d'agents IA 
// processus qui lie les agents entre eux et avec les outils pour accomplir des tâches complexes
// exemple: créer une équipe d'agents pour organiser un voyage (recherche de destinations, réservation de vols, etc)

import { Tool, Agent, Task  } from './core.js';
import { lmStudioTool, fetchTool, fileWriteTool, generateQRCodeTool, translateToEnglishTool, weatherTool } from './tools.js';
import 'dotenv/config'; 
const LM_API_URL = process.env.LM_API_URL;
const LM_MODEL = process.env.LM_MODEL;

// --- GLOBAL CONFIG ----

const SEARCH_TERM = 'economie'; 
const VERBOSE = false; 


// ---- 5 AGENTS (nom, tool, prompt) ----

const fetcher = new Agent('Fetcher', [fetchTool]);

const analyst = new Agent(
    'Analyst', 
    [lmStudioTool], 
    "Tu es un expert en analyse d'actualités économiques."
);

const extractor = new Agent(
    'Extractor', 
    [lmStudioTool],
    "Tu es un assistant qui extrait des faits et actualités clés."
);

const writer = new Agent(
    'Writer', 
    [lmStudioTool],
    "Tu es un rédacteur SEO qui écrit des articles de blogs optimisés pour le référencement."
);

const injector = new Agent('Injector', [fileWriteTool]);


// ---- 5 TÂCHES (toolName, input, description = "") ----

// recherche dynamique de l'URL 
const url = `https://fr.wikinews.org/w/index.php?search=${encodeURIComponent(SEARCH_TERM)}&ns0=1`;

const tasks = [
    new Task('fetch', url, 'Récupération de la page Wikinews'),
    new Task('lmStudio', 'Analyse ce contenu et extrait les principales actualités et informations.', 'Analyse des données'), 
    new Task('lmStudio', 'Prends le résumé précédent et extrait uniquement les faits et les chiffres économiques importants.', 'Extraction des faits clés'),
    new Task('lmStudio', 'Rédige un article de blog sur ce contenu. Tu dois parler des actualités. Formate en markdown et optimisé en SEO. Le texte sera directement injecté dans WordPress', 'Rédaction de l\'article'),
    new Task('fileWrite', { fileName: 'result.md', content: '' }, 'Création du fichier final'),
]; 

// ---- CREW -----

class Crew {
    constructor(agents = []) {
        this.agents = agents;
    }

    /**
     * exécute les tâches distribuées aux 5 agents de manière cyclique
     * en injectant les résultats précédents dans les tâches suivantes 
     * pour créer une continuité dans le processus
     */
    async run(tasks = []) {
        const results = [];
        let lastResult = null;
        let counter = 0; 

        for (const task of tasks) {
            const agent = this.agents[counter % this.agents.length];
            const toolName = task.toolName;
            const percent = Math.round(((counter+1) / tasks.length) * 100);
            console.log(`Etape ${counter + 1}/${tasks.length} (${percent}%) - Agent ${agent.name} exécute la tâche: ${task.description}`);
        
            // injecte instruction + resultat pour LM studio 
            if (toolName === 'lmStudio' && counter > 0 && lastResult) {
                const truncatedResult = typeof lastResult === 'string' ? lastResult.substring(0, 5000) : lastResult;
                task.input = `${task.input}\n\nRésultat précédent:\n${truncatedResult}`;
            } else if (counter > 0 && typeof lastResult === 'string' && lastResult) {
                const truncatedResult = lastResult.substring(0, 5000);
                task.input = `${task.input}\n\nRésultat précédent:\n${truncatedResult}`;
            }

            // agent 5 ecrit le résultat dans un fichier markdown
            if (toolName === 'fileWrite') {
                const finalContent = lastResult || "Erreur : Le rédacteur n'a pas généré de texte.";
                //créeer l'objet attendu par l'outil fileWrite 
                task.input = { 
                    fileName: 'result.md', 
                    content: typeof finalContent === 'string' ? finalContent : JSON.stringify(finalContent)
                };
            }

            lastResult = await agent.perform(task);

            if(VERBOSE && toolName === 'lmStudio') {
                console.log(`Résultat de la tâche ${counter + 1}: ${lastResult}`);
            } else if(toolName !== 'lmStudio') {
                console.log(`Résultat de la tâche ${counter + 1}: ${lastResult}`);
            }

            results.push(lastResult);
            counter++;
        }
        console.log(`Tâches terminées. Résultat final:\n${lastResult}`);
        return results;
    }
}

const crew = new Crew([fetcher, analyst, extractor, writer, injector]);
crew.run(tasks).then(console.log); 