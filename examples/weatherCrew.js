// exemple d'équipe d'agents (un récupère data , un autre les analyse) pour la météo 
import { Tool, Agent, Task  } from '../core.js';
import { lmStudioTool, fetchTool, fileWriteTool, generateQRCodeTool, translateToEnglishTool, weatherTool } from '../tools.js';
import 'dotenv/config';
const LM_API_URL = process.env.LM_API_URL;
const LM_MODEL = process.env.LM_MODEL;
const CITY = 'Paris';
const VERBOSE = true; 
// agents IA
const weatherFetcher = new Agent('WeatherFetcher', [weatherTool]);
const weatherAnalyst = new Agent(
    'WeatherAnalyst', 
    [lmStudioTool], 
    `Tu es un expert météorologue strict. 
    IMPORTANT : Utilise EXCLUSIVEMENT les données météo fournies dans le message. 
    Ne cherche pas à deviner la date ou la température. 
    Si les données indiquent 14.8°C le 12 mai 2026, utilise ces chiffres exacts.
    Sois concis, clair et donne des conseils vestimentaires adaptés.`
);
// tasks 
const tasks = [
    new Task(`weather`, CITY, `Récupère les données météo pour ${CITY} en utilisant l'outil météo.`),
    new Task(
        'lmStudio', 
        `Analyse les données météo récupérées pour ${CITY} et donne des conseils pratiques.`, 
        `Analyse les données météo récupérées pour ${CITY} et donne des conseils pratiques. Sois concis et clair.`
    ), 
];

// crew 
class Crew {
    constructor(agents = []) {
        this.agents = agents;
    }

    // chaque tâche return un result 
    async run(tasks = []) {
        const results = []; 
        let lastResult = null; 

        for (let i = 0; i < tasks.length; i ++) {
            const agent = this.agents[i % this.agents.length]; //mêmme nb agents que de taches 
            const toolName = tasks[i].toolName
            const percent = Math.round(((i + 1) / tasks.length) * 100);// % de progression

            console.log(`\n[CREW] Tâche ${i + 1}/${tasks.length} (${percent}%) - Agent: ${agent.name}, Outil: ${toolName}`);
            
            if (toolName === 'lmStudio' && lastResult) {
                tasks[i].input = `${tasks[i].input}\n\nDonnées météo: ${lastResult}`;
            }

            lastResult = await agent.perform(tasks[i], (progress) => {
                if (VERBOSE && progress.type === 'log') {
                    console.log(`[${progress.level.toUpperCase()}] ${progress.message}`);
                }   }).then(result => {
                    console.log(`Tâche ${i + 1} accomplie avec succès. Résultat:`, result);
                    results.push(result);
                }).catch(error => {
                    console.error(`Erreur lors de l'exécution de la tâche ${i + 1}:`, error);
                    results.push(`Erreur: ${error.message}`);
            });

            console.log(`Progression: ${percent}%. analyse metéo pour ${CITY}...`);
        }

        return results; 
    }
}


// utilisation de la crew
const crew = new Crew([weatherFetcher, weatherAnalyst]);

crew.run(tasks).then(results => {
    console.log('\n[CREW] Toutes les tâches sont accomplies. Résultats finaux:');   
    results.forEach((result, index) => {
        console.log(`Tâche ${index + 1}: ${result}`);
    }   );
}).catch(error => {
    console.error('[CREW] Erreur lors de l\'exécution de la crew:', error);
});