let blockCounter = 0; 
let connections = [];
let selectedBlock = null;
let connecting = false;
let connectStartBlock = null;
let blocks = []; //pour blocs avec data
let consoleExpanded = false; 

/* remplace data par defaut */
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


function createBlock(type, data = null) {
    const blockId = `block_${blockCounter++}`;
    const blockData = data || { ...blockTemplates[type] };

    // block par defaut
    if (type === 'agent' && !data) {
        blockData.name = blockData.name.replace('${id}', blockCounter); 
    }

    // block avec data
    const block = { 
        id: blockId, 
        type, 
        data: blockData, 
        x: 100 + (blockCounter * 50), 
        y: 100 + (blockCounter * 50), 
        connections: [] 
    };
    blocks.push(block);

    if (!data) {
        addBlockToWorkspace(block);
    }

    return block;
}

function addBlockToWorkspace(block) {
    const { id, type, data, x, y } = block;
    const title = type === 'agent' ? data.name : 'Tâche';

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

        Object.assign(blockElement.style, { left: `${x}px`, top: `${y}px` });
        blockElement.addEventListener('click', (e) => selectBlock(id));
        // makeDraggable(blockElement, block);
        document.getElementById('workspace').appendChild(blockElement);
}

function deleteBlock(blockId) {
    blocks = blocks.filter(block => block.id !== blockId); // remove from blocks array
    document.getElementById(blockId).remove(); // remove from DOM
}

function selectBlock(blockId) {
    document.querySelectorAll('.block').forEach(block => block.classList.remove('selected'));
    document.getElementById(blockId).classList.add('selected');
}

function makeDraggable(element, block) {
    let isDragging = false, startX, startY, initialX, initialY;

    element.addEventListener('mousedown', (e) => {
        if (e.target.closest('.connection-point, button')) return; //don't drag

        isDragging = true;
        elemennt.style.zIndex = 1000;
        element.style.transition = 'none';
        const rect = element.getBoundingClientRect();
        const workspaceRect = document.getElementById('workspace').getBoundingClientRect();

        // mouse when clicked and  position of the block relative to workspace
        [startX, startY] = [e.clientX, e.clientY];
        // calcule distance from workspace top-left to block top-left
        [initialX, initialY] = [rect.left - workspaceRect.left, rect.top - workspaceRect.top];

        Object.assign(document.body.style, { userSelect: 'none', cursor: 'grabbing' });
    });
}