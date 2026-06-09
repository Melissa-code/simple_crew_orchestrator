// ============================================================================
// core.js: fonctionnalités de base du projet 
// les 3 principales classes, définition d'équipe, agent, tâches.... 
// ============================================================================

//************************************************************************** */
// Outil exécutable par un agent

class Tool {
    constructor(name, func) {
        this.name = name;
        this.func = func;
    }

    async execute(input) {
        return await this.func(input);
    }
}

//************************************************************************** */
// Agent capable d'exécuter des tâches via des outils

class Agent {
    constructor(name, tools = [], prompt = "") {
        this.name = name;
        this.tools = tools;
        this.prompt = prompt;
    }

    findTool(toolName) {
        return this.tools.find(tool => tool.name === toolName);
    }

    /**
     * Exécute une tâche avec l'outil correspondant, 
     * gère les erreurs et fournit des mises à jour de progression via onProgress
     */
    async perform(task, onProgress = null) {
        const tool = this.findTool(task.toolName);

        if (!tool) {
            const error = `Outil ${task.toolName} introuvable pour l'agent ${this.name}`;
            if (onProgress) {
                onProgress({ 
                    type: 'log', 
                    level: 'error', 
                    message: error 
                });
            }
            throw new Error(error);       
        }

        if (onProgress) {
            onProgress({
                type: 'log',
                level: 'info',
                message: `Agent ${this.name} utilise l'outil ${tool.name} pour accomplir la tâche: ${task.description}`
            });
        }

        try {
            // exécuter l'outil (API ne repond pas pour code robuste qui ne crash pas)
            return await tool.execute(task.input);
        } catch (error) {
            if (onProgress) {
                onProgress({
                    type: 'log',
                    level: 'error',
                    message: `Erreur lors de l'exécution de l'outil ${tool.name} par l'agent ${this.name}: ${error.message}`
                });
            }
            throw error;
        }
    }
}

//************************************************************************** */
// Tâche à confier à un agent

class Task {
    constructor(toolName, input, description = "") {
        this.toolName = toolName;
        this.input = input;
        this.description = description;
    }
}

//**************************************************************************
// Equipe d'agents  

class Crew {
    constructor(agents = []) {
        this.agents = agents;
    }

    async run(tasks = [], onProgress = null) {
        const results = [];
        let lastResult = null;

        for (let i = 0; i < tasks.length; i++) {
            const agent = this.agents[i % this.agents.length];
            const toolName = tasks[i].toolName;
            const percent = Math.round(((i + 1) / tasks.length) * 100);

            console.log(`Etape ${i + 1}/${tasks.length} (${percent}%) - Agent ${agent.name} exécute la tâche: ${tasks[i].description}`);
        
            if (onProgress) {
                onProgress({
                    step: i + 1,
                    total: tasks.length,
                    percent,
                    agent: agent.name,
                    tool: toolName,
                    type: 'progress',
                }); 

                onProgress({
                    type: 'log',
                    level: 'info',
                    message: `Exécution de la tâche: ${tasks[i].description}`
                });
            }

            // Injection du résultat précédent
            if (toolName === 'lmStudio' && i > 0 && lastResult) {
                const resultStr = typeof lastResult === 'string' 
                ? lastResult 
                : JSON.stringify(lastResult);
                tasks[i].input = `${tasks[i].input}\n\nRésultat de la tâche précédente:\n${resultStr}`;
            } else if (toolName === 'fileWrite' && lastResult) {
                tasks[i].input.content = typeof lastResult === 'string' 
                ? lastResult 
                : JSON.stringify(lastResult);
            } else if (i > 0 && typeof tasks[i].input === 'object' && lastResult) {
                tasks[i].input = typeof lastResult === 'string' 
                ? lastResult 
                : JSON.stringify(lastResult);
            }

            // Log input
            if (onProgress) {
                const inputStr = typeof tasks[i].input === 'object'
                    ? JSON.stringify(tasks[i].input)
                    : tasks[i].input;
                onProgress({
                    type: 'log',
                    level: 'info',
                    message: `Input de la tâche: ${inputStr.substring(0, 200)}${inputStr.length > 200 ? '...' : ''}`
                });
            }

            try {
                lastResult = await agent.perform(tasks[i], onProgress);

                if (onProgress) {
                    const resultStr = typeof lastResult === 'object' 
                    ? JSON.stringify(lastResult) : lastResult;
                    onProgress({
                        type: 'log',
                        level: 'info',
                        message: `Résultat de la tâche: ${resultStr.substring(0, 200)}${resultStr.length > 200 ? '...' : ''}`
                    });
                }
                results.push(lastResult);
            } catch (error) {
                if (onProgress) {
                    onProgress({
                        type: 'log',
                        level: 'error',
                        message: `Erreur lors de l'exécution: ${error.message}`
                    });
                }
                throw error;
            }
        } 
        
        return results;
    }
}


export { Tool, Agent, Task, Crew };