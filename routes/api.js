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
        const agents = workflow.agents.map(agentData => {
            return new Agent(agentData.name, agentData.tools, agentData.prompt);
        });

        const tasks = workflow.tasks.map(taskData => { 
            return new Task(taskData.input, taskData.toolName); 
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