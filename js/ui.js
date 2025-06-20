'use strict';

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
    
    // 1. 全角を半角に変換
    let value = toHalfWidth(originalValue);
    
    // 2. 数字とマイナス記号以外を削除
    value = value.replace(/[^0-9-]/g, '');

    // 3. カンマ区切りにフォーマット
    const formattedValue = formatNumber(value);

    // 4. 値を更新
    if (input.value !== formattedValue) {
        const cursorPosition = input.selectionStart;
        const diff = formattedValue.length - originalValue.length;
        input.value = formattedValue;
        if(cursorPosition !== null) {
            input.setSelectionRange(cursorPosition + diff, cursorPosition + diff);
        }
    }
}

/**
 * 数値入力フィールドを初期化し、IME対応や自動フォーマットのイベントリスナーを設定します。
 * @param {HTMLInputElement} input - 初期化する入力要素。
 * @param {function} [onChange] - 値が変更されたときに呼び出されるコールバック関数。
 */
export function initializeNumberInput(input, onChange) {
    let isComposing = false;

    const triggerChange = () => {
        formatNumberInput(input);
        if (onChange) {
            onChange();
        }
    };

    input.addEventListener('compositionstart', () => { isComposing = true; });
    input.addEventListener('compositionend', () => {
        isComposing = false;
        triggerChange();
    });
    input.addEventListener('input', () => {
        if (!isComposing) {
            triggerChange();
        }
    });
    // For browsers that don't support compositionend well with all IMEs
    input.addEventListener('blur', () => {
        const value = parseFormattedNumber(input.value);
        input.value = formatNumber(isNaN(value) ? 0 : value);
        if (onChange) {
            onChange();
        }
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

/**
 * ツールチップ機能を初期化します。
 * info-iconがクリックされたときにツールチップを表示/非表示します。
 */
export function initializeTooltips() {
    let activeTooltip = null;

    const hideTooltip = () => {
        if (activeTooltip) {
            activeTooltip.style.display = 'none';
            activeTooltip = null;
        }
    };

    document.addEventListener('click', (e) => {
        const infoIcon = e.target.closest('.info-icon');

        if (infoIcon) {
            e.preventDefault();
            e.stopPropagation();
            const targetId = infoIcon.dataset.tooltipTarget;
            const tooltip = document.getElementById(targetId);

            if (tooltip) {
                if (activeTooltip === tooltip) {
                    hideTooltip();
                } else {
                    hideTooltip(); // Hide any other active tooltip
                    activeTooltip = tooltip;
                    tooltip.style.display = 'block';

                    // Position the tooltip
                    const iconRect = infoIcon.getBoundingClientRect();
                    const tooltipRect = tooltip.getBoundingClientRect();

                    let top = iconRect.bottom + window.scrollY + 5;
                    let left = iconRect.left + window.scrollX - (tooltipRect.width / 2) + (iconRect.width / 2);

                    // Prevent overflow
                    if (left < 0) left = 5;
                    if (left + tooltipRect.width > document.documentElement.clientWidth) {
                        left = document.documentElement.clientWidth - tooltipRect.width - 5;
                    }
                     if (top + tooltipRect.height > document.documentElement.clientHeight + window.scrollY) {
                        top = iconRect.top + window.scrollY - tooltipRect.height - 5;
                    }

                    tooltip.style.left = `${left}px`;
                    tooltip.style.top = `${top}px`;
                }
            }
        } else {
            // Clicked outside an info icon or tooltip
            if (!e.target.closest('.tooltip-content')) {
                 hideTooltip();
            }
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            hideTooltip();
        }
    });
}

/**
 * 画面サイズに応じてステップ番号のラベルを動的に変更します。
 */
function handleStepLabels() {
    const step2H2 = document.querySelector('#step2-card h2 .step-label');
    const step3H2 = document.querySelector('#step3-card h2 .step-label');

    if (!step2H2 || !step3H2) return;

    if (window.innerWidth < 1200) {
        // Mobile view: 2次相続がStep2, 1次相続の内容がStep3
        step3H2.textContent = 'STEP 2';
        step2H2.textContent = 'STEP 3';
    } else {
        // Desktop view: 元に戻す
        step2H2.textContent = 'STEP 2';
        step3H2.textContent = 'STEP 3';
    }
}

/**
 * レスポンシブ対応のイベントハンドラを初期化します。
 */
export function initializeResponsiveHandlers() {
    // 初回実行
    handleStepLabels();
    // ウィンドウリサイズ時にも実行
    window.addEventListener('resize', handleStepLabels);
}
