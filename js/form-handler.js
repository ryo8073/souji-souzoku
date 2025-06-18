'use strict';

import { formatNumber, formatNumberInput, parseFormattedNumber } from './ui.js';

let onFormChangeCallback = () => {};

/**
 * フォームハンドラを初期化し、イベントリスナーを設定します。
 * @param {function} callback - フォームの値が変更されたときに呼び出されるコールバック関数。
 */
export function initializeForms(callback) {
    onFormChangeCallback = callback;
    const addHeirBtn = document.getElementById('addHeirBtn');
    if (addHeirBtn) {
        addHeirBtn.addEventListener('click', () => {
            addHeirForm();
            onFormChangeCallback();
        });
    }

    // すべての初期入力フィールドに変更リスナーを設定
    document.querySelectorAll('.input-section input, .input-section select').forEach(input => {
        if (input.type !== 'date' && input.tagName !== 'SELECT') {
             // Use the 'input' event for real-time updates
            input.addEventListener('input', onFormChangeCallback);
        } else {
            // 'change' is better for date and select inputs
            input.addEventListener('change', onFormChangeCallback);
        }

        if (input.classList.contains('number-input')) {
            // Add real-time formatting to all number inputs
            input.addEventListener('input', () => formatNumberInput(input));
        }
    });
    
    // 初期相続人フォームを1つ追加
    if (document.getElementById('heirsContainer').children.length === 0) {
        addHeirForm();
    }
}

/**
 * 相続人フォームを動的に追加します。
 * @returns {string} 追加された相続人のユニークID。
 */
function addHeirForm() {
    const heirsContainer = document.getElementById('heirsContainer');
    const template = document.getElementById('heirFormTemplate');
    if (!heirsContainer || !template) return;

    const heirCount = heirsContainer.children.length + 1;
    const clone = document.importNode(template.content, true);
    
    const heirId = `heir_${Date.now()}`;
    const form = clone.querySelector('.heir-form');
    form.dataset.heirId = heirId;
    form.querySelector('.heir-form__number').textContent = heirCount;

    clone.querySelector('.btn-remove-heir').addEventListener('click', function() {
        this.closest('.heir-form').remove();
        updateHeirNumbers();
        onFormChangeCallback();
    });

    const toggleButton = clone.querySelector('.btn-toggle-heir');
    toggleButton.addEventListener('click', function() {
        const form = this.closest('.heir-form');
        const body = form.querySelector('.heir-form__body');
        const icon = this.querySelector('.icon');
        
        const isExpanded = body.classList.toggle('collapsed');
        form.classList.toggle('is-collapsed', isExpanded);

        this.setAttribute('aria-expanded', !isExpanded);
        icon.textContent = !isExpanded ? '▲' : '▼';
    });

    // Also allow toggling by clicking the header itself
    clone.querySelector('.heir-form__header').addEventListener('click', (e) => {
        // Prevent toggling when buttons inside the header are clicked
        if (e.target.closest('button')) return;
        toggleButton.click();
    });

    clone.querySelectorAll('input, select').forEach(input => {
        const oldId = input.id;
        const newId = oldId + heirId;
        input.id = newId;
        const label = clone.querySelector(`label[for="${oldId}"]`);
        if(label) label.htmlFor = newId;

        input.addEventListener('change', () => {
            updateHeirHeader(form);
            onFormChangeCallback();
        });

        if (input.classList.contains('number-input')) {
            input.addEventListener('input', () => {
                formatNumberInput(input)
                updateHeirHeader(form);
            });
        }
    });

    heirsContainer.appendChild(clone);
    updateHeirNumbers();
    updateHeirHeader(form); // Set initial header state
    return heirId;
}

function updateHeirHeader(formElement) {
    if (!formElement) return;
    const status = formElement.querySelector('select[id^="heirStatus"]')?.value || '';
    const assetValue = parseFormattedNumber(formElement.querySelector('input[id^="heirAssetValue"]')?.value || '0');

    const statusPreview = formElement.querySelector('.heir-status-preview');
    const assetPreview = formElement.querySelector('.heir-asset-preview');

    if (statusPreview) {
        statusPreview.textContent = status;
    }
    if (assetPreview) {
        assetPreview.textContent = `D: ${formatNumber(assetValue)} 円`;
    }
}

function updateHeirNumbers() {
    document.querySelectorAll('#heirsContainer .heir-form').forEach((form, index) => {
        form.querySelector('.heir-form__number').textContent = index + 1;
    });
}

/**
 * 現在のフォーム入力値をすべて取得してオブジェクトとして返します。
 * @returns {object} フォームデータのオブジェクト。
 */
export function getFormData() {
    const data = {};
    // Card 1: 今回の相続
    data.deceasedName = document.getElementById('deceasedName')?.value;
    data.secondInheritanceDate = document.getElementById('secondInheritanceDate')?.value;

    // Card 2: 前回の相続
    data.firstDeceasedRelation = document.getElementById('firstDeceasedRelation')?.value;
    data.firstInheritanceDate = document.getElementById('firstInheritanceDate')?.value;
    data.previousTaxAmount = parseFormattedNumber(document.getElementById('previousTaxAmount')?.value);
    data.previousAssetValue = parseFormattedNumber(document.getElementById('previousAssetValue')?.value);

    // Card 3: 今回の相続人
    data.totalAssetValue = parseFormattedNumber(document.getElementById('totalAssetValue')?.value);
    data.heirs = Array.from(document.querySelectorAll('#heirsContainer .heir-form')).map(form => ({
        id: form.dataset.heirId,
        name: form.querySelector('.heir-name')?.value,
        relation: form.querySelector('.heir-relation')?.value,
        status: form.querySelector('select[id^="heirStatus"]')?.value || '法定相続人',
        assetValue: parseFormattedNumber(form.querySelector('input[id^="heirAssetValue"]')?.value)
    }));
    
    return data;
}

/**
 * 渡されたデータオブジェクトに基づいてフォームの値を設定します。
 * @param {object} data - フォームに設定するデータ。
 */
export function setFormData(data) {
    // Card 1
    document.getElementById('deceasedName').value = data.deceasedName || '';
    document.getElementById('secondInheritanceDate').value = data.secondInheritanceDate || '';
    
    // Card 2
    document.getElementById('firstDeceasedRelation').value = data.firstDeceasedRelation || 'spouse';
    document.getElementById('firstInheritanceDate').value = data.firstInheritanceDate || '';

    const prevTaxEl = document.getElementById('previousTaxAmount');
    prevTaxEl.value = formatNumber(data.previousTaxAmount || 0);
    
    const prevAssetEl = document.getElementById('previousAssetValue');
    prevAssetEl.value = formatNumber(data.previousAssetValue || 0);

    // Card 3
    const totalAssetEl = document.getElementById('totalAssetValue');
    totalAssetEl.value = formatNumber(data.totalAssetValue || 0);

    const heirsContainer = document.getElementById('heirsContainer');
    heirsContainer.innerHTML = ''; // Clear existing heirs

    data.heirs.forEach(heirData => {
        const heirId = addHeirForm();
        const form = document.querySelector(`.heir-form[data-heir-id="${heirId}"]`);
        if (form) {
            form.querySelector('.heir-name').value = heirData.name || '';
            form.querySelector('.heir-relation').value = heirData.relation || '長男';
            form.querySelector('select[id^="heirStatus"]').value = heirData.status || '法定相続人';
            const heirAssetEl = form.querySelector('input[id^="heirAssetValue"]');
            heirAssetEl.value = formatNumber(heirData.assetValue || 0);
            updateHeirHeader(form); // Update header after setting data
        }
    });
    
    onFormChangeCallback();
}
