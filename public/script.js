let blockCounter = 0; 
let connections = [];
let selectedBlock = null;
let connecting = false;
let connectStartBlock = null;
let blocks = []; //blocks with data
let consoleExpanded = false; 

/* replace data by default */
const blockTemplates = {
    agent: { 
        name: 'Agent ${id}', 
        tools: ['lmStudio'], 
        prompt: 'Tu es un assistant IA utile.' 
    },
    task: { 
        input: '',
        toolName: 'lmStudio' 
    }
};

const toolConfigs = {
    fetch: { 
        param: 'url', 
        placeholder: 'https://example.com', 
        label: 'URL:' 
    },
    weather: { 
        param: 'city', 
        placeholder: 'Paris', 
        label: 'Ville:' 
    },
    writeFile: { 
        param: 'filename', 
        placeholder: 'output.txt', 
        label: 'Nom du fichier:', 
        default: 'output.txt' 
    },
    lmStudio: { 
        param: 'input', 
        placeholder: 'Votre instruction...', 
        label: 'Prompt/Input:', 
        type: 'textarea' 
    },
};

/**
 * Crée un objet bloc (Agent ou Tâche) et l'ajoute au tableau global blocks[]
 * @param {string} type -type de bloc (agent ou task)
 * @param {Object} data - données du bloc (facultatif)
 * @returns {Object} - return bloc créé
 */
function createBlock(type, data = null) {
    const blockId = `block_${blockCounter++}`; // unique id 
    const blockData = data || { ...blockTemplates[type] }; //copy to not mutate the template

    // block by default
    if (type === 'agent' && !data) {
        blockData.name = blockData.name.replace('${id}', blockCounter); 
    }

    // block object with data
    const block = { 
        id: blockId, 
        type, 
        data: blockData, 
        x: 100 + (blockCounter * 30), // avoid superposition
        y: 100 + (blockCounter * 30), 
        connections: [] 
    };
    blocks.push(block);

    // inject block visually in workspace if no data provided
    if (!data) {
        addBlockToWorkspace(block);
    }

    return block;
}

/**
 * Génère HTML d'un bloc et l'injecte visuellement dans le Workspace (DOM)
 * @param {Object} block - objet bloc généré par createBlock()
 */
function addBlockToWorkspace(block) {
    const { id, type, data, x, y } = block;
    const title = type === 'agent' ? data.name : 'Tâche';

    // create block element (fusion of HTML and JS)
    const blockElement = Object.assign(document.createElement('div'), { 
        className: `block ${type}-block`, 
        id, 
        innerHTML: `
            <div class="block-header">
                <span>${title}</span>
                <button onclick="deleteBlock('${id}')" style="background:none; border:none; color:white; cursor:pointer;">✕</button>
            </div>
            <div class="block-content">
                <small></small>
            </div>

            <div class="connection-point output" onclick="startConnection('${id}'); event.stopPropagation();"></div>
            <div class="connection-point input" onclick="endConnection('${id}'); event.stopPropagation();"></div>
        `
    });

    // set position and add to workspace
    Object.assign(blockElement.style, { left: `${x}px`, top: `${y}px` });
    blockElement.addEventListener('click', (e) => selectBlock(id));

    makeDraggable(blockElement, block);
    document.getElementById('workspace').appendChild(blockElement);
}

/**
* Rend un élément HTML déplaçable à la souris dans le Workspace (DOM)
 * @param {HTMLElement} element - élément HTML du bloc (blockElement)
 * @param {Object} block - objet de données JS correspondant
 */
function makeDraggable(element, block) {
    let isDragging = false; 
    let startX, startY; 
    let initialX, initialY;

    // click and drag
    element.addEventListener('mousedown', (e) => {
        // don't drag if clicking on connection points or buttons
        if (e.target.closest('.connection-point, button')) return; 

        isDragging = true;
        element.style.zIndex = 1000; // bring the block to front
        element.style.transition = 'none';

        const rect = element.getBoundingClientRect();
        const workspaceRect = document.getElementById('workspace').getBoundingClientRect();

        // mouse when clicked and position of the block relative to workspace
        [startX, startY] = [e.clientX, e.clientY];
        // calcule distance from workspace top-left to block top-left
        [initialX, initialY] = [rect.left - workspaceRect.left, rect.top - workspaceRect.top];

        Object.assign(document.body.style, { userSelect: 'none', cursor: 'grabbing' });
    });

    // movement 
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return; 

        // use requestAnimationFrame for smoother animation (browser optimization)
        requestAnimationFrame(() => {
            //calculate new position based on mouse movement
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            // update block position in data
            block.x = initialX + dx;
            block.y = initialY + dy;
         
            // update block position in DOM
            element.style.transform = `translate(${dx}px, ${dy}px)`;
        });
    });

    // release mouse button
    document.addEventListener('mouseup', (e) => {
        if (!isDragging) return;

        isDragging = false;
        element.style.zIndex = '';
        element.style.transition = '';
        element.style.transform = ''; // reset transform  z-index

        Object.assign(element.style, { left: `${block.x}px`, top: `${block.y}px` });
        Object.assign(document.body.style, { userSelect: '', cursor: '' });

        // update connections
        updateConnections();
    });
}

function deleteBlock(blockId) {
    blocks = blocks.filter(block => block.id !== blockId); // remove from blocks array
    document.getElementById(blockId).remove(); // remove from DOM
    console.log(`Bloc supprimé avec succès ! ID: ${blockId}`);
}

/**
 * Sélectionne bloc et déclenche l'affichage de ses propriétés
 * @param {int} blockId 
 */
function selectBlock(blockId) {
    document.querySelectorAll('.block').forEach(block => block.classList.remove('selected'));
    document.getElementById(blockId).classList.add('selected');
    selectedBlock = blockId;

    // display properties in the right panel
    showProperties(blockId);
}

/**
 * Génère et injecte formulaire HTML dans la sidebar selon le type de bloc
 * @param {string} blockId - ID du bloc à afficher
 */
function showProperties(blockId) {
    const block = blocks.find(b => b.id === blockId);
    const propertiesPanel = document.getElementById('properties');
    if (!block && !propertiesPanel) return;

    // 1- Agent properties 
    if (block.type === 'agent') {
        propertiesPanel.innerHTML = `
            <h3>Propriétés de l'Agent</h3>
             <div class="form-group">
                <label>Nom:</label>
                <input type="text" class="form-control" value="${block.data.name}" onchange="updateProperty('${blockId}', 'name', this.value)">
            </div>
            <div class="form-group">
                <label>Outils:</label>
                <select class="form-control" onchange="updateProperty('${blockId}', 'tools', [this.value])">
                    ${Object.keys(toolConfigs).map(tool => `<option value="${tool}" ${block.data.tools.includes(tool) ? 'selected' : ''}>${tool}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Prompt:</label>
                <textarea class="form-control" rows="4" onchange="updateProperty('${blockId}', 'prompt', this.value)">${block.data.prompt}</textarea>
            </div>
        `;
    // 2- Task properties
    } else if (block.type === 'task') {
        const toolName = block.data.toolName || 'lmStudio';
        propertiesPanel.innerHTML = `
            <h3>Propriétés de la Tâche</h3>
            <div class="form-group">
                <label>Outil (Tool) :</label>
                <select class="form-control" onchange="updateTaskTool('${blockId}', this.value)">
                    ${Object.keys(toolConfigs).map(tool => `
                        <option value="${tool}" ${toolName === tool ? 'selected' : ''}>${tool}</option>
                    `).join('')}
                </select>
            </div>
            <div id="tool-parameters-zone">
                ${getToolParameters(toolName, block.data)}
            </div>
        `;
    }
}

/**
* Génère le champ de saisie dynamique pour l'outil d'une tâche
 * @param {string} toolName - Le nom de l'outil (ex: 'lmStudio')
 * @param {Object} data - Les données actuelles du bloc tâche 
 */
function getToolParameters(toolName, data) {
    const config = toolConfigs[toolName]; // fetch, weather, writeFile, lmStudio
    if (!config) return '';
    // value from data or default value if not set
    const value = data[config.param] || config.default || '';
    
    //  HTML (textarea/input)
    const inputType = config.type === 'textarea' ? 
        `<textarea class="form-control" rows="4" placeholder="${config.placeholder}">${value}</textarea>` :
        `<input type="text" class="form-control" value="${value}" placeholder="${config.placeholder}">`;
    
    // inject oninput event to update property in real-time
    return `
        <div class="form-group">
            <label>${config.label}</label>
            ${inputType.replace('>', ` oninput="updateProperty('${selectedBlock}', '${config.param}', this.value)">`)}
        </div>
    `;
}

/**
 * Preview block content in the workspace (DOM) based on its type and data
 * @param {*} blockId 
 * @returns 
 */
function updateBlockPreview(blockId) {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;

    const content = document.querySelector(`#${blockId} .block-content small`);
    if (content) {
        content.textContent = block.type === 'task' ? `Tool: ${block.data.toolName}` : '';
    }
}

function updateProperty(blockId, property, value) {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;

    // update property in block data
    block.data[property] = value;

    if (property === 'name' && block.type === 'agent') {
        // update block in workspace
        document.querySelector(`#${blockId} .block-header span`).textContent = value;
    }
    updateBlockPreview(blockId); 
}

function updateTaskTool(blockId, newTool) {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return; 

    Object.keys(toolConfigs).forEach(tool => {
       const config = toolConfigs[tool]; // fetch, weather, writeFile, lmStudio
       delete block.data[config.param]; // remove old tool parameters
    });

    block.data.toolName = newTool; // update tool name

    const config = toolConfigs[newTool];
    if (config && config.default) {
        block.data[config.param] = config.default; 
    }

    showProperties(blockId); // refresh properties panel
    updateBlockPreview(blockId); // refresh block preview
}

function startConnection(blockId) {
    connecting = true;
    connectStartBlock = blockId;
    document.body.style.cursor = 'crosshair'; // change cursor to indicate connection mode
}

function endConnection(blockId) {
    if (connecting && connectStartBlock && connectStartBlock !== blockId) {
        connections.push({ from: connectStartBlock, to: blockId });
        updateConnections();
        [connecting, connectStartBlock] = [false, null];
    }
}

function updateConnections() {
   const svgCanvas = document.getElementById('connections');
    if (!svgCanvas) return;

    // empty SVG canvas before redrawing
    svgCanvas.innerHTML = '';

    connections.forEach(conn => {
        const fromEl = document.getElementById(conn.from);
        const toEl = document.getElementById(conn.to);

        if (!fromEl || !toEl) return;

        // get pastilles de connexion spécifiques dans le HTML
        const outPoint = fromEl.querySelector('.connection-point.output');
        const inPoint = toEl.querySelector('.connection-point.input');

        if (!outPoint || !inPoint) return;

        // pastilles de connexion (output et input) coordonnées
        const workspaceRect = document.getElementById('workspace').getBoundingClientRect();
        const outRect = outPoint.getBoundingClientRect();
        const inRect = inPoint.getBoundingClientRect();

        const x1 = (outRect.left + outRect.width / 2) - workspaceRect.left;
        const y1 = (outRect.top + outRect.height / 2) - workspaceRect.top;
        const x2 = (inRect.left + inRect.width / 2) - workspaceRect.left;
        const y2 = (inRect.top + inRect.height / 2) - workspaceRect.top;

        // create courbe de Bézier (Cubic Bézier Curve)
        const controlOffset = Math.abs(x2 - x1) * 0.5;
        const pathData = `M ${x1} ${y1} C ${x1 + controlOffset} ${y1}, ${x2 - controlOffset} ${y2}, ${x2} ${y2}`;

        // SVG element and injection into DOM
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathData);
        path.setAttribute('class', 'connection-line');
        
        svgCanvas.appendChild(path);
    });
}

function clearCanvas() {
    blocks = [];
    connections = [];
    blockCounter = 0;
    selectedBlock = null;

    //clear workspace
    document.querySelectorAll('.block').forEach(block => block.remove());
    const svgCanvas = document.getElementById('connections');
    if (svgCanvas) svgCanvas.innerHTML = '';

    //properties panel 
    const propertiesPanel = document.getElementById('properties');
    if (propertiesPanel) {
        propertiesPanel.innerHTML = '<p>Sélectionnez un bloc pour modifier ses propriétés</p>';
    }
    console.log("Le canevas a été entièrement vidé et réinitialisé !");
}

/**
 * ouvre ou ferme la console de débogage en bas de l'écran
 */
function toggleConsole() {
    const console = document.getElementById('console');
    const toggle = document.getElementById('consoleToggle');
    if (!console || !toggle) return;

    if (consoleExpanded) {
        console.className = 'console collapsed';
        toggle.textContent = '▲';
        consoleExpanded = false;
    } else {
        console.className = 'console expanded';
        toggle.textContent = '▼';
        consoleExpanded = true;
    }
}

function logToConsole(type, message) {
    const content = document.getElementById('consoleContent');
    const logEntry = document.createElement('div');

    logEntry.className = `log-entry log-${type}`;
    logEntry.innerHTML = `<span class="log-timestamp">[${new Date().toLocaleTimeString()}]</span>${message}`;
    content.appendChild(logEntry);
    content.scrollTop = content.scrollHeight; // auto-scroll to bottom
}

function clearLogsToConsole() {
    const content = document.getElementById('consoleContent');
    content.innerHTML = `<div class="log-entry log-info"><span class="log-timestamp">[${new Date().toLocaleTimeString()}]</span>Console vidée</div>`;
}

/**
 * lance l'exécution du workflow en validant les blocs, 
 * en envoyant les données au serveur ,
 * et en affichant les résultats dans la console
 */
async function executeWorkflow() {
    if (blocks.length === 0) {
        alert("Ajoutez des blocs avant de lancer l'exécution !");
        return;
    }

    clearLogsToConsole();
    logToConsole('info', 'Exécution du workflow en cours...');

    //validation
    for (const block of blocks.filter(b => b.type === 'task')) {
        const validation = validateTaskParameters(block);
        if (!validation.valid) {
            logToConsole('error', `Bloc Tâche ID: ${block.id} - Erreur: ${validation.message}`);
            return alert(`Erreur : ${validation.message}`);
        }
    }

    logToConsole('info', `Validation réussie - ${blocks.filter(b => b.type === 'agent').length} agents, ${blocks.filter(b => b.type === 'task').length} tâches`);

    const workflow = {
        agents: blocks.filter(b => b.type === 'agent').map(b => b.data),
        tasks: blocks.filter(b => b.type === 'task').map(b =>  formatTaskForExecution(b.data)),
    }
    document.getElementById('progressContainer').style.display = 'block';
    document.querySelectorAll('.connection-point').forEach(dot => dot.classList.add('active')); 

    try {
        logToConsole('info', 'Envoi du workflow au serveur...');
        const response = await fetch('/api/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ workflow: workflow })
        });

        const result = await response.json();
        
        setTimeout(() => {
            document.getElementById('progressContainer').style.display = 'none';
            document.querySelectorAll('.connection-point').forEach(dot => dot.classList.remove('active'));

            if (result.success) {
                logToConsole('success', 'Workflow exécuté avec succès !');
                result.results.forEach((res, index) => {
                    logToConsole('info', `Résultat de la tâche ${index + 1}: ${res}`);
                });
                alert('Workflow exécuté avec succès ! Consultez la console pour les résultats.');
            } else {
                logToConsole('error', `Erreur lors de l'exécution du workflow: ${result.message}`);
                alert(`Erreur : ${result.message}`);
            }
        }, 2000); // simulate delay for progress bar
    } catch (error) {
        document.getElementById('progressContainer').style.display = 'none';
        document.querySelectorAll('.connection-point').forEach(dot => dot.classList.remove('active'));
        logToConsole('error', `Erreur réseau ou serveur: ${error.message}`);
        alert(`Erreur réseau ou serveur : ${error.message}`);
    }
}

function validateTaskParameters(taskBlock) {
    const toolName = taskBlock.data.toolName;
    const config = toolConfigs[toolName];
    if (!config) return { valid: false, message: `Outil inconnu: ${toolName}` };

    if (['fetch', 'weather', 'writeFile'].includes(toolName)) {
        const value = taskBlock.data[config.param];
        if (!value || !value.trim()) {
            return { valid: false, message: `${config.label.slice(0, -1)} requis pour ${toolName}` };
        }
    }
    
    return { valid: true };
}

/**
 * formatte les données d'une tâche pour l'exécution côté serveur
 * @param {*} taskData 
 * @returns 
 */
function formatTaskForExecution(taskData) {
    const { toolName } = taskData;
    // mapping des inputs selon l'outil
    const inputs = {
        fetch: taskData.url,
        weather: taskData.city,
        writeFile: { filename: taskData.filename, content: '' },
        lmStudio: taskData.input || '',
    };

    return { input: inputs[toolName] || inputs.lmStudio, toolName };
}