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


export { Tool, Agent, Task };