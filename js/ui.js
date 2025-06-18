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
 * 全角数字・英字を半角に変換します。
 * @param {string} str - 変換する文字列。
 * @returns {string} 変換後の文字列。
 */
function toHalfWidth(str) {
    if (!str) return '';
    return str.replace(/[！-～]/g, s => {
        return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
    });
}

/**
 * 数値をフォーマットして文字列として返します（例: 1000 -> "1,000"）。
 * @param {number|string} num - フォーマットする数値。
 * @returns {string} フォーマット後の文字列。
 */
export function formatNumber(num) {
    if (num === null || num === undefined || num === '') return '0';
    const number = typeof num === 'string' ? parseFormattedNumber(num) : num;
    return new Intl.NumberFormat('ja-JP').format(number);
}

/**
 * フォーマットされた数値文字列（"1,000"など）をパースして数値に変換します。
 * @param {string} str - パースする文字列。
 * @returns {number} パース後の数値。
 */
export function parseFormattedNumber(str) {
    if (typeof str !== 'string') return isNaN(Number(str)) ? 0 : Number(str);
    const halfWidthStr = toHalfWidth(str);
    const numericValue = parseInt(halfWidthStr.replace(/,/g, ''), 10);
    return isNaN(numericValue) ? 0 : numericValue;
}

/**
 * 渡された入力要素の値を数値としてフォーマットします。
 * @param {HTMLInputElement} input - 対象の入力要素。
 */
export function formatNumberInput(input) {
    const originalValue = input.value;
    const cursorPosition = input.selectionStart;
    
    // 1. 全角を半角に変換
    let value = toHalfWidth(originalValue);
    
    // 2. 数字とマイナス記号以外を削除
    value = value.replace(/[^0-9-]/g, '');

    // 3. カンマ区切りにフォーマット
    const formattedValue = formatNumber(value);

    // 4. 値を更新
    input.value = formattedValue;

    // 5. カーソル位置を調整
    if (cursorPosition !== null) {
        const diff = formattedValue.length - originalValue.length;
        input.setSelectionRange(cursorPosition + diff, cursorPosition + diff);
    }
}

/**
 * 数値入力フィールドを初期化し、IME対応や自動フォーマットのイベントリスナーを設定します。
 * @param {HTMLInputElement} input - 初期化する入力要素。
 */
export function initializeNumberInput(input) {
    let isComposing = false;

    input.addEventListener('compositionstart', () => {
        isComposing = true;
    });

    input.addEventListener('compositionend', (event) => {
        isComposing = false;
        // compositionendイベントの後にinputイベントが発火するため、ここでフォーマットする
        formatNumberInput(event.target);
    });

    input.addEventListener('input', (event) => {
        // IME変換中は処理をスキップ
        if (isComposing) return;
        formatNumberInput(event.target);
    });
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
