'use strict';

import { calculateAll } from './calculator.js';
import { getFormData, setFormData, initializeForms } from './form-handler.js';
import { initializeStorage, saveData, loadData } from './storage.js';
import { formatNumber, initializeTooltips, initializeResponsiveHandlers } from './ui.js';

/**
 * 計算結果に基づいてUIを更新します。
 */
function updateUI() {
    const formData = getFormData();
    const results = calculateAll(formData);
    
    // Dynamic Label Update for A and B
    const deceasedName = formData.secondDeceasedName || '...';
    document.getElementById('deceasedNameForA').textContent = deceasedName;
    document.getElementById('deceasedNameForB').textContent = deceasedName;
    
    // E: 経過年数の表示
    const periodDisplay = document.getElementById('inheritance-period-display');
    const periodText = periodDisplay.querySelector('.period-text');

    if (results.error) {
        periodText.textContent = results.error;
        periodDisplay.classList.add('error');
    } else {
        periodDisplay.classList.remove('error');
        if (results.yearsPassed >= 0) {
            periodText.textContent = `期間 (E): ${results.yearsPassed} 年`;
        } else {
            periodText.textContent = '期間 (E): - 年';
        }
    }

    // 各相続人のプレビュー表示を更新
    if (results.heirResults && formData.heirs) {
        results.heirResults.forEach(heirResult => {
            const form = document.querySelector(`.heir-form[data-heir-id="${heirResult.id}"]`);
            if (form) {
                const namePreview = form.querySelector('.heir-name-preview');
                const assetPreview = form.querySelector('.heir-asset-preview');
                const deductionPreview = form.querySelector('.heir-deduction-preview');
                const statusPill = form.querySelector('.heir-status-pill');
                
                const heirData = formData.heirs.find(h => h.id === heirResult.id);
                if (heirData) {
                     namePreview.textContent = heirData.name || '未入力';
                     assetPreview.textContent = `取得財産: ${formatNumber(heirData.assetValue)} 円`;

                     if (heirData.status && heirData.status !== '法定相続人') {
                        statusPill.textContent = heirData.status;
                        statusPill.style.display = 'inline-block';
                     } else {
                        statusPill.style.display = 'none';
                     }
                }
                
                if (deductionPreview) {
                    deductionPreview.textContent = `相次相続控除額: ${formatNumber(Math.round(heirResult.deduction))} 円`;
                }
            }
        });
    }

    // 合計取得財産額の表示 (Cの値)
    const totalAssetSummaryEl = document.getElementById('total-asset-value-summary');
    totalAssetSummaryEl.textContent = `${formatNumber(formData.totalAssetValue)} 円`;

    // 合計控除額の表示
    const totalDeductionEl = document.getElementById('total-deduction-amount');
    totalDeductionEl.textContent = `${formatNumber(Math.floor(results.totalDeduction))} 円`;
}

/**
 * アプリケーションを初期化します。
 */
function initialize() {
    initializeForms(updateUI);
    initializeStorage(updateUI);
    initializeTooltips();
    initializeResponsiveHandlers();

    /*
    // 初期読み込み時に保存されたデータがあれば読み込む
    const initialData = loadData();
    if (initialData) {
        setFormData(initialData);
    }
    */
    
    // 初期表示のために一度UIを更新
    updateUI();
}

// DOMの読み込みが完了したらアプリケーションを初期化
document.addEventListener('DOMContentLoaded', initialize);

