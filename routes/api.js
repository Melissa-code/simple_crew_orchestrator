import express from 'express';
import { Agent, Task, Crew } from '../core.js'; 
import { lmStudioTool, fetchTool, fileWriteTool, generateQRCodeTool, translateToEnglishTool, weatherTool } from '../tools.js';

const router = express.Router();
const toolsMap = {
    'lmStudio': lmStudioTool,
    'fetch': fetchTool,
    'fileWrite': fileWriteTool,
    'generateQRCode': generateQRCodeTool,
    'translateToEnglish': translateToEnglishTool,
    'weather': weatherTool
}


//test : http://localhost:3001/api/test)
router.get('/test', (req, res) => {
    return res.json({ message: 'API is working!' });
});

//exécution : http://localhost:3001/api/execute
router.post('/execute', async (req, res) => {
    const { workflow } = req.body; 

    try {
        // ex: agentData = { name: "Agent météo", tools: ["weather"], prompt: "..." }
        const agents = workflow.agents.map(agentData => {
            // convertir les noms d'outils (strings) en vraies instances Tool via toolsMap
            const agentTools = (agentData.tools || []) //liste de noms d'outils de cet agent (ex: ["weather"])
                .map(toolName => toolsMap[toolName])//pour chaque element de la liste, donne nvlle liste
                .filter(Boolean); // enlève les outils inconnus
            return new Agent(agentData.name, agentTools, agentData.prompt);
        });

        const tasks = workflow.tasks.map(taskData => { 
            return new Task( taskData.toolName, taskData.input,); 
        });

        const crew = new Crew(agents);
        const results = await crew.run(tasks, (data) => {
            console.log('Progress Data : ', data);
        });

        return res.json({ success: true, results });

    } catch (error) {
        console.error('Error processing workflow:', error);
        return res.status(500).json({ 
            error: 'Internal server error', 
            details: error.message 
        });
    }
});

export default router;