'use strict';

import { formatNumber, parseFormattedNumber, initializeNumberInput } from './ui.js';

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
    document.querySelectorAll('.simulation-grid input, .simulation-grid select').forEach(input => {
        if (input.type === 'date' || input.tagName === 'SELECT') {
            input.addEventListener('change', onFormChangeCallback);
        } else {
             // 'input' event for real-time updates on text fields
            input.addEventListener('input', onFormChangeCallback);
        }

        if (input.classList.contains('number-input')) {
            initializeNumberInput(input, onFormChangeCallback);
        }
    });
    
    // 初期状態で相続人フォームを1つ追加
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

    const clone = document.importNode(template.content, true);
    
    const heirId = `heir_${Date.now()}`;
    const form = clone.querySelector('.heir-form');
    form.dataset.heirId = heirId;

    clone.querySelector('.btn-remove-heir').addEventListener('click', function() {
        this.closest('.heir-form').remove();
        updateHeirNumbers();
        onFormChangeCallback();
    });

    const toggleButton = clone.querySelector('.btn-toggle-heir');
    const header = clone.querySelector('.heir-form__header');
    
    const toggleCollapse = () => {
        const body = form.querySelector('.heir-form__body');
        const isCollapsed = body.classList.toggle('collapsed');
        form.classList.toggle('is-collapsed', isCollapsed);
        toggleButton.setAttribute('aria-expanded', !isCollapsed);
        toggleButton.querySelector('.icon').textContent = isCollapsed ? '▼' : '▲';
    };

    header.addEventListener('click', (e) => {
        if (e.target.closest('button')) return; // Don't toggle if a button was clicked
        toggleCollapse();
    });

    // Initialize all inputs within the new heir form
    clone.querySelectorAll('input, select').forEach(input => {
        const oldId = input.id;
        const newId = `${oldId}_${heirId}`;
        input.id = newId;
        const label = clone.querySelector(`label[for="${oldId}"]`);
        if (label) label.htmlFor = newId;

        if (input.classList.contains('number-input')) {
            initializeNumberInput(input, onFormChangeCallback);
        } else {
             input.addEventListener('input', onFormChangeCallback);
             input.addEventListener('change', onFormChangeCallback);
        }
    });

    heirsContainer.appendChild(clone);
    updateHeirNumbers();
    return heirId;
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

    // 1次相続
    data.firstDeceasedName = document.getElementById('firstDeceasedName')?.value;
    data.firstInheritanceDate = document.getElementById('firstInheritanceDate')?.value;

    // 2次相続
    data.secondDeceasedName = document.getElementById('secondDeceasedName')?.value;
    data.secondInheritanceDate = document.getElementById('secondInheritanceDate')?.value;
    data.previousTaxAmount = parseFormattedNumber(document.getElementById('previousTaxAmount')?.value); // A
    data.previousAssetValue = parseFormattedNumber(document.getElementById('previousAssetValue')?.value); // B
    data.totalAssetValue = parseFormattedNumber(document.getElementById('totalAssetValue')?.value); // C

    // 相続人
    data.heirs = Array.from(document.querySelectorAll('#heirsContainer .heir-form')).map(form => ({
        id: form.dataset.heirId,
        name: form.querySelector('.heir-name')?.value,
        status: form.querySelector('select[id^="heirStatus"]')?.value || '法定相続人',
        assetValue: parseFormattedNumber(form.querySelector('input[id^="heirAssetValue"]')?.value) // D
    }));
    
    return data;
}

/**
 * 渡されたデータオブジェクトに基づいてフォームの値を設定します。
 * @param {object} data - フォームに設定するデータ。
 */
export function setFormData(data) {
    // 1次相続
    document.getElementById('firstDeceasedName').value = data.firstDeceasedName || '';
    document.getElementById('firstInheritanceDate').value = data.firstInheritanceDate || '';
    
    // 2次相続
    document.getElementById('secondDeceasedName').value = data.secondDeceasedName || '';
    document.getElementById('secondInheritanceDate').value = data.secondInheritanceDate || '';
    document.getElementById('previousTaxAmount').value = formatNumber(data.previousTaxAmount || 0);
    document.getElementById('previousAssetValue').value = formatNumber(data.previousAssetValue || 0);
    document.getElementById('totalAssetValue').value = formatNumber(data.totalAssetValue || 0);

    // 相続人
    const heirsContainer = document.getElementById('heirsContainer');
    heirsContainer.innerHTML = ''; // Clear existing heirs

    if (data.heirs && data.heirs.length > 0) {
        data.heirs.forEach(heirData => {
            const heirId = addHeirForm();
            const form = document.querySelector(`.heir-form[data-heir-id="${heirId}"]`);
            if (form) {
                form.querySelector('.heir-name').value = heirData.name || '';
                form.querySelector('select[id^="heirStatus"]').value = heirData.status || '法定相続人';
                form.querySelector('input[id^="heirAssetValue"]').value = formatNumber(heirData.assetValue || 0);
            }
        });
    } else {
        // データがない場合でも、最低1つのフォームは表示する
        addHeirForm();
    }
    
    onFormChangeCallback();
}
