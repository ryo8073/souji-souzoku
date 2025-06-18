'use strict';

import { helpTexts } from './data.js';

const modal = document.getElementById('helpModal');
const modalTitle = document.getElementById('helpModalTitle');
const modalContent = document.getElementById('helpModalContent');
const closeModalBtn = document.getElementById('closeHelpModal');

/**
 * UIコンポーネントを初期化します。
 */
export function initializeUI() {
    initializeExplanationSection();
    initializeHelpButtons();
    initializeModal();
}

/**
 * 説明セクションの開閉機能を初期化します。
 */
function initializeExplanationSection() {
    const toggleBtn = document.getElementById('toggleExplanation');
    const explanationContent = document.getElementById('explanationContent');
    
    if (toggleBtn && explanationContent) {
        toggleBtn.addEventListener('click', () => {
            const isExpanded = explanationContent.classList.toggle('expanded');
            toggleBtn.querySelector('.icon').textContent = isExpanded ? '▲' : '▼';
            toggleBtn.setAttribute('aria-expanded', isExpanded);
        });
    }
}

/**
 * ヘルプボタンのイベントリスナーを初期化します。
 */
function initializeHelpButtons() {
    // input-section 内のヘルプボタンにイベントリスナーを設定
    document.querySelector('.input-section').addEventListener('click', (e) => {
        const button = e.target.closest('.btn-help');
        if (!button) return;

        e.preventDefault(); // labelのデフォルト動作を抑制
        const helpKey = button.dataset.help;
        if (helpTexts[helpKey]) {
            showHelpModal(helpTexts[helpKey].title, helpTexts[helpKey].content);
        }
    });
}

/**
 * ヘルプモーダルの基本機能を初期化します。
 */
function initializeModal() {
    if(closeModalBtn) {
        closeModalBtn.addEventListener('click', hideHelpModal);
    }

    if(modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                hideHelpModal();
            }
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'block') {
            hideHelpModal();
        }
    });
}

/**
 * ヘルプモーダルを表示します。
 * @param {string} title - モーダルのタイトル。
 * @param {string} content - モーダルの内容 (HTML)。
 */
function showHelpModal(title, content) {
    if (modalTitle && modalContent && modal) {
        modalTitle.textContent = title;
        modalContent.innerHTML = content;
        modal.style.display = 'block';
    }
}

/**
 * ヘルプモーダルを非表示にします。
 */
function hideHelpModal() {
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * 計算結果をUIに表示します。
 * @param {object} calculationResult - 計算結果のデータ。
 */
export function updateResults(calculationResult) {
    const { totalDeduction, heirCalculations, status, message } = calculationResult;

    const resultSummaryEl = document.querySelector('.result-summary');
    const totalDeductionEl = document.getElementById('totalDeduction');
    const resultTableBodyEl = document.getElementById('resultTableBody');

    // 既存の警告メッセージを削除
    const existingAlert = resultSummaryEl?.querySelector('.alert');
    if (existingAlert) {
        existingAlert.remove();
    }

    // 新しい警告メッセージを表示 (必要な場合)
    if (status === '適用不可' && message && resultSummaryEl) {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert--warning';
        alertDiv.textContent = message;
        // 合計額の前に挿入
        resultSummaryEl.insertBefore(alertDiv, totalDeductionEl);
    }
    
    if (totalDeductionEl) {
        totalDeductionEl.textContent = `${formatNumber(totalDeduction)} 円`;
    }

    if (resultTableBodyEl) {
        resultTableBodyEl.innerHTML = ''; // Clear previous results
        heirCalculations.forEach(heir => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${escapeHTML(heir.name) || '未入力'}</td>
                <td>${escapeHTML(heir.status) || '未選択'}</td>
                <td>${formatNumber(heir.assetValue)} 円</td>
                <td>${formatNumber(heir.deductionAmount)} 円</td>
            `;
            resultTableBodyEl.appendChild(row);
        });
    }
}

/**
 * 数値を3桁区切りの文字列にフォーマットします。
 * @param {number} num - フォーマットする数値。
 * @returns {string} フォーマットされた文字列。
 */
export function formatNumber(num) {
    if (typeof num !== 'number' || isNaN(num)) {
        return '0';
    }
    return Math.floor(num).toLocaleString();
}

/**
 * 入力中の数値をリアルタイムで3桁区切りにフォーマットします。
 * @param {HTMLInputElement} inputElement - 対象のinput要素。
 */
export function formatNumberInput(inputElement) {
    if (!inputElement) return;
    const value = inputElement.value;
    const selectionStart = inputElement.selectionStart;
    const rawValue = parseFormattedNumber(value);

    const formattedValue = rawValue.toLocaleString();
    inputElement.value = formattedValue;
    
    // カーソル位置を調整
    const lengthDiff = formattedValue.length - value.length;
    if (selectionStart !== null) {
        inputElement.setSelectionRange(selectionStart + lengthDiff, selectionStart + lengthDiff);
    }
}

/**
 * 3桁区切りされた数値文字列をパースして数値に戻します。
 * @param {string} value - フォーマットされた文字列。
 * @returns {number} パースされた数値。
 */
export function parseFormattedNumber(value) {
    if (typeof value !== 'string') return 0;
    // 数字とマイナス記号以外をすべて削除
    const sanitizedValue = value.replace(/[^\d-]/g, '');
    return Number(sanitizedValue) || 0;
}

/**
 * HTML特殊文字をエスケープします。
 * @param {string} str - エスケープする文字列。
 * @returns {string} エスケープされた文字列。
 */
function escapeHTML(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/[&<>"']/g, function(match) {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[match];
    });
}
