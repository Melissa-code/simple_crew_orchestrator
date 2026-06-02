// comment utiliser l'outil pour créer équipe d'agents IA 
// processus qui lie les agents entre eux et avec les outils pour accomplir des tâches complexes
// exemple: créer une équipe d'agents pour organiser un voyage (recherche de destinations, réservation de vols, etc)

import { Tool, Agent, Task  } from './core.js';
import { lmStudioTool, fetchTool, fileWriteTool, generateQRCodeTool, translateToEnglishTool, weatherTool } from './tools.js';
import 'dotenv/config'; 
const LM_API_URL = process.env.LM_API_URL;
const LM_MODEL = process.env.LM_MODEL;
