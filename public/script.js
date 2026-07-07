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
        innerHTML: 
            `<div class="block-header">
                <span>${title}</span>
                <button onclick="deleteBlock('${id}')" style="background:none; border:none; color:white; cursor:pointer;">✕</button>
            </div>
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
        
    });
}

function deleteBlock(blockId) {
    blocks = blocks.filter(block => block.id !== blockId); // remove from blocks array
    document.getElementById(blockId).remove(); // remove from DOM
    console.log(`Bloc supprimé avec succès ! ID: ${blockId}`);
}

function selectBlock(blockId) {
    document.querySelectorAll('.block').forEach(block => block.classList.remove('selected'));
    document.getElementById(blockId).classList.add('selected');
    console.log(`Bloc sélectionné ! ID: ${blockId}`);
}