'use strict';

// defaultFamilyTree と defaultRelationships は削除されたため、import文も削除
// import { defaultFamilyTree, defaultRelationships } from './data.js';

let svg;
let mainGroup; // Group to hold all zoomable/pannable elements
let zoomLevel = 1;
let isDragging = false;
let dragStartX, dragStartY;
let svgOffsetX = 0, svgOffsetY = 0;

const PADDING = 50;
const PERSON_RADIUS = 30;

/**
 * 家系図の初期化を行います。
 */
export function initializeFamilyTree() {
    const container = document.getElementById('familyTreeContainer');
    if (!container) return;

    container.innerHTML = '';
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'family-tree-svg');
    svg.id = 'familyTreeSvg';
    
    mainGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    svg.appendChild(mainGroup);
    
    container.appendChild(svg);

    // Event listeners
    document.getElementById('zoomInBtn')?.addEventListener('click', () => zoom(1.2));
    document.getElementById('zoomOutBtn')?.addEventListener('click', () => zoom(0.8));
    document.getElementById('resetZoomBtn')?.addEventListener('click', resetView);

    svg.addEventListener('mousedown', startDrag);
    svg.addEventListener('mousemove', drag);
    svg.addEventListener('mouseup', endDrag);
    svg.addEventListener('mouseleave', endDrag);

    drawFamilyTree([]);
}

/**
 * 現在のフォームデータに基づいて家系図を再描画します。
 * @param {Array} heirs - 相続人のデータ配列。
 * @param {object} deceasedInfo - 被相続人の情報。
 */
export function drawFamilyTree(heirs = [], deceasedInfo = {}, firstDeceasedInfo = {}) {
    if (!mainGroup) return;
    mainGroup.innerHTML = ''; // Clear previous tree

    const familyData = buildFamilyData(heirs, deceasedInfo, firstDeceasedInfo);
    
    // Draw relationships first, so they are in the background
    drawRelationships(familyData.relationships, familyData.nodes);
    // Draw each person node
    familyData.nodes.forEach(person => drawPerson(person, familyData.nodes));

    resetView();
}

/**
 * Builds the data structure for the family tree from default data and heir inputs.
 * @param {Array} heirs - The list of heirs from the form.
 * @param {object} deceasedInfo - Information about the deceased person.
 * @param {object} firstDeceasedInfo - Information about the first deceased person.
 * @returns {object} An object containing the list of nodes and relationships.
 */
function buildFamilyData(heirs, deceasedInfo, firstDeceasedInfo) {
    const nodes = [];
    const relationships = [];

    // 1. 今回の被相続人（二次相続）を家系図の中心に配置
    const deceasedNode = {
        id: 'deceased',
        name: deceasedInfo.deceasedName || '被相続人',
        gender: 'neutral',
        status: 'deceased',
        role: '（被相続人）',
        deathDate: deceasedInfo.secondInheritanceDate,
        position: { x: 300, y: 150 }
    };
    nodes.push(deceasedNode);

    // 2. 前回の被相続人（一次相続）を追加
    if (firstDeceasedInfo.relation) {
        const firstDeceasedNode = {
            id: 'first_deceased',
            name: firstDeceasedInfo.name || '前回の被相続人',
            gender: 'neutral',
            status: 'deceased',
            role: '（前回の被相続人）',
            deathDate: firstDeceasedInfo.firstInheritanceDate,
            position: { x: 300, y: 50 } // 二次相続人の上に配置
        };
        nodes.push(firstDeceasedNode);

        // 関係性を定義
        relationships.push({
            type: 'parent-child', // 親子として表現
            from: firstDeceasedNode.id,
            to: [deceasedNode.id]
        });
    }

    // 3. 今回の相続人を動的に追加
    const heirNodes = heirs.map((heir, index) => {
        const yPos = heir.relation === '配偶者' ? 150 : 250;
        const xPos = heir.relation === '配偶者' ? 450 : 100 + index * 150;
        return {
            id: heir.id,
            name: heir.name || `相続人${index + 1}`,
            gender: heir.relation?.includes('男') || heir.relation?.includes('兄') || heir.relation?.includes('弟') ? 'male' : (heir.relation?.includes('女') || heir.relation?.includes('姉') || heir.relation?.includes('妹') ? 'female' : 'neutral'),
            status: 'alive',
            role: `（${heir.relation}）`,
            heirStatus: heir.status,
            deductionAmount: heir.deductionAmount,
            position: { x: xPos, y: yPos }
        };
    });
    nodes.push(...heirNodes);

    // 4. 相続人との関係性を整理して追加
    const spouseNode = heirNodes.find(h => h.role.includes('配偶者'));
    const childNodes = heirNodes.filter(h => !h.role.includes('配偶者'));

    // 配偶者がいれば、婚姻関係の線を追加
    if (spouseNode) {
        relationships.push({
            type: 'marriage',
            from: deceasedNode.id,
            to: spouseNode.id
        });
    }

    // 子（配偶者以外の相続人）が一人でもいれば、親子関係の線を追加
    if (childNodes.length > 0) {
        relationships.push({
            type: 'parent-child',
            from: deceasedNode.id,
            to: childNodes.map(c => c.id) // 全員をまとめて渡す
        });
    }

    return { nodes, relationships };
}

/**
 * Draws a single person node on the SVG canvas.
 * @param {object} person - The person's data object.
 */
function drawPerson(person) {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('class', `person-node person--${person.gender}`);
    
    // Add heir status class if it exists
    if (person.heirStatus) {
        let statusClass = '';
        switch (person.heirStatus) {
            case '相続放棄':
                statusClass = 'status--renunciation';
                break;
            case '相続欠格':
                statusClass = 'status--disqualification';
                break;
            case '死亡':
                statusClass = 'status--deceased';
                break;
        }
        if (statusClass) {
            group.classList.add(statusClass);

            // Add a status indicator symbol inside the circle
            const statusText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            statusText.setAttribute('class', 'person-status-indicator');
            statusText.setAttribute('text-anchor', 'middle');
            statusText.setAttribute('dy', '0.3em'); // Vertically center
            
            let symbol = '';
             switch (person.heirStatus) {
                case '相続放棄':
                    symbol = '放';
                    break;
                case '相続欠格':
                    symbol = '欠';
                    break;
                case '死亡':
                    symbol = '亡';
                    break;
            }
            statusText.textContent = symbol;
            group.appendChild(statusText);
        }
    }

    group.setAttribute('transform', `translate(${person.position.x}, ${person.position.y})`);

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('r', PERSON_RADIUS);
    
    const nameText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    nameText.setAttribute('class', 'person-name');
    nameText.setAttribute('text-anchor', 'middle');
    nameText.setAttribute('y', '5');
    nameText.textContent = person.name;

    const roleText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    roleText.setAttribute('class', 'person-role');
    roleText.setAttribute('text-anchor', 'middle');
    roleText.setAttribute('y', '22');
    roleText.textContent = person.role || '';

    const dateText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    dateText.setAttribute('class', 'person-date');
    dateText.setAttribute('text-anchor', 'middle');
    dateText.setAttribute('y', '50');
    dateText.textContent = person.deathDate || '';

    group.appendChild(circle);
    group.appendChild(nameText);
    group.appendChild(roleText);
    group.appendChild(dateText);

    if (person.deathDate) {
        const cross = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        cross.setAttribute('class', 'deceased-mark');
        cross.setAttribute('x1', -PERSON_RADIUS * 0.7);
        cross.setAttribute('y1', -PERSON_RADIUS * 0.7);
        cross.setAttribute('x2', PERSON_RADIUS * 0.7);
        cross.setAttribute('y2', PERSON_RADIUS * 0.7);
        const cross2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        cross2.setAttribute('class', 'deceased-mark');
        cross2.setAttribute('x1', PERSON_RADIUS * 0.7);
        cross2.setAttribute('y1', -PERSON_RADIUS * 0.7);
        cross2.setAttribute('x2', -PERSON_RADIUS * 0.7);
        cross2.setAttribute('y2', PERSON_RADIUS * 0.7);
        group.appendChild(cross);
        group.appendChild(cross2);
    }

    // Add deduction amount bubble or status bubble if applicable
    let bubbleContent = null;
    let bubbleClass = 'deduction-bubble';

    if (['相続放棄', '相続欠格', '法定外'].includes(person.heirStatus)) {
        bubbleContent = [{ text: person.heirStatus }];
        bubbleClass = 'status-bubble';
    } else if (person.deductionAmount && person.deductionAmount > 0) {
        bubbleContent = [
            { text: '相次相続控除' },
            { text: `${person.deductionAmount.toLocaleString()} 円`, dy: '1.2em' }
        ];
    }

    if (bubbleContent) {
        const bubbleGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        bubbleGroup.setAttribute('class', bubbleClass);

        const bubbleText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        bubbleText.setAttribute('class', 'deduction-text');
        
        bubbleContent.forEach(line => {
            const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
            tspan.setAttribute('x', 0);
            tspan.setAttribute('dy', line.dy || 0);
            tspan.textContent = line.text;
            bubbleText.appendChild(tspan);
        });
        
        // Temporarily append to measure size
        mainGroup.appendChild(bubbleGroup);
        bubbleGroup.appendChild(bubbleText);

        // Position text first, then create a rect around it
        bubbleText.setAttribute('x', 0);
        bubbleText.setAttribute('y', PERSON_RADIUS + 28); // Adjusted spacing
        bubbleText.setAttribute('text-anchor', 'middle');

        const textBBox = bubbleText.getBBox();
        const bubbleRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        bubbleRect.setAttribute('class', 'deduction-rect');
        bubbleRect.setAttribute('x', textBBox.x - 10);
        bubbleRect.setAttribute('y', textBBox.y - 5);
        bubbleRect.setAttribute('width', textBBox.width + 20);
        bubbleRect.setAttribute('height', textBBox.height + 10);
        bubbleRect.setAttribute('rx', 5);

        // Insert rect behind the text
        bubbleGroup.insertBefore(bubbleRect, bubbleText);
        
        // Now that it's measured, move it into the person's group
        group.appendChild(bubbleGroup);
    }
    
    mainGroup.appendChild(group);
}

function getNode(id, nodes) {
    return nodes.find(n => n.id === id);
}

function drawRelationships(relationships, nodes) {
    relationships.forEach(rel => {
        if (rel.type === 'marriage') {
            const fromNode = getNode(rel.from, nodes);
            const toNode = getNode(rel.to, nodes);
            if (fromNode && toNode) {
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('class', 'relationship-line');
                line.setAttribute('x1', fromNode.position.x);
                line.setAttribute('y1', fromNode.position.y);
                line.setAttribute('x2', toNode.position.x);
                line.setAttribute('y2', toNode.position.y);
                mainGroup.insertBefore(line, mainGroup.firstChild);
            }
        } else if (rel.type === 'parent-child') {
            const fromNode = getNode(rel.from, nodes);
            if (!fromNode || !Array.isArray(rel.to) || rel.to.length === 0) return;

            const children = rel.to.map(id => getNode(id, nodes)).filter(Boolean);
            if (children.length === 0) return;

            const parentY = fromNode.position.y;
            const childrenY = children[0].position.y;
            const midY = parentY + (childrenY - parentY) / 2;
            
            // Vertical line from parent
            const verticalLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            verticalLine.setAttribute('class', 'relationship-line');
            verticalLine.setAttribute('x1', fromNode.position.x);
            verticalLine.setAttribute('y1', parentY);
            verticalLine.setAttribute('x2', fromNode.position.x);
            verticalLine.setAttribute('y2', midY);
            mainGroup.insertBefore(verticalLine, mainGroup.firstChild);

            // Horizontal line
            const firstChildX = children[0].position.x;
            const lastChildX = children[children.length - 1].position.x;
            const horizontalLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            horizontalLine.setAttribute('class', 'relationship-line');
            horizontalLine.setAttribute('x1', firstChildX);
            horizontalLine.setAttribute('y1', midY);
            horizontalLine.setAttribute('x2', lastChildX);
            horizontalLine.setAttribute('y2', midY);
            mainGroup.insertBefore(horizontalLine, mainGroup.firstChild);
            
            // Vertical lines to children
            children.forEach(child => {
                 const childVerticalLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                 childVerticalLine.setAttribute('class', 'relationship-line');
                 childVerticalLine.setAttribute('x1', child.position.x);
                 childVerticalLine.setAttribute('y1', midY);
                 childVerticalLine.setAttribute('x2', child.position.x);
                 childVerticalLine.setAttribute('y2', child.position.y);
                 mainGroup.insertBefore(childVerticalLine, mainGroup.firstChild);
            });
        }
    });
}

function zoom(factor) {
    zoomLevel = Math.max(0.1, Math.min(zoomLevel * factor, 5));
    updateTransform();
}

/**
 * resets the view of the family tree
 */
export function resetView() {
    if (!mainGroup || mainGroup.children.length === 0) return;

    const bbox = mainGroup.getBBox();
    if(bbox.width === 0 || bbox.height === 0) return;

    const containerWidth = svg.parentElement.clientWidth;
    const containerHeight = svg.parentElement.clientHeight;

    zoomLevel = Math.min(containerWidth / (bbox.width + PADDING), containerHeight / (bbox.height + PADDING));
    
    svgOffsetX = (containerWidth / 2) - (bbox.x + bbox.width / 2) * zoomLevel;
    svgOffsetY = (containerHeight / 2) - (bbox.y + bbox.height / 2) * zoomLevel;

    updateTransform();
}

function startDrag(e) {
    if (e.target.closest('.person-node')) return;
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    svg.classList.add('dragging');
}

function drag(e) {
    if (!isDragging) return;
    e.preventDefault();
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    svgOffsetX += dx;
    svgOffsetY += dy;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    updateTransform();
}

function endDrag() {
    isDragging = false;
    svg.classList.remove('dragging');
}

function updateTransform() {
    if(mainGroup) {
      mainGroup.setAttribute('transform', `translate(${svgOffsetX}, ${svgOffsetY}) scale(${zoomLevel})`);
    }
}
