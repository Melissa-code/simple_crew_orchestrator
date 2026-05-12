// comment utiliser l'outil pour créer équipe d'agents IA 
// processus qui lie les agents entre eux et avec les outils pour accomplir des tâches complexes
// exemple: créer une équipe d'agents pour organiser un voyage (recherche de destinations, réservation de vols, etc)

import { Tool, Agent, Task  } from './core.js';
import { lmStudioTool, fetchTool, fileWriteTool, generateQRCodeTool, translateToEnglishTool, weatherTool } from './tools.js';
import 'dotenv/config'; 
const LM_API_URL = process.env.LM_API_URL;
const LM_MODEL = process.env.LM_MODEL;


//***************************************************************************************************************************** */
// utilisation de l'outil de génération de QR code

const agentQRCode = new Agent('QRCodeAgent', [generateQRCodeTool], "Génère un QR code pour une URL donnée.");
const taskGenerateQRCode = new Task('generateQRCode', 'https://www.cnes.fr', 'Génération du QR Code pour l\'URL du CNES');

agentQRCode.perform(taskGenerateQRCode, (progress) => {
    if (progress.type === 'log') {
        console.log(`[${progress.level.toUpperCase()}] ${progress.message}`);
    }   
    }).then(result => {
        console.log('Tâche accomplie avec succès. Résultat:', result);
    }).catch(error => {
        console.error('Erreur lors de l\'exécution de la tâche:', error);
}); 

//***************************************************************************************************************************** */
// utilisation de l'outil de traduction fr -> en

const agentTranslate = new Agent('translateToEnglish', [translateToEnglishTool], "Traduis ce texte en français vers l'anglais.");
const taskTranslate = new Task('translateToEnglish', 'Bonjour, comment ça va?', 'Traduction du texte français en anglais');

agentTranslate.perform(taskTranslate, (progress) => {
    if (progress.type === 'log') {
        console.log(`[${progress.level.toUpperCase()}] ${progress.message}`);
    }   
    }).then(result => {
        console.log('Tâche accomplie avec succès. Résultat:', result);
    }).catch(error => {
        console.error('Erreur lors de l\'exécution de la tâche:', error);
    });

