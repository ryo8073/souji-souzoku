'use strict';

import { calculateYearsBetween } from './date-utils.js';

/**
 * 小数点以下第4位で切り捨て（トルンケート）するヘルパー関数
 * @param {number} num - 対象の数値
 * @returns {number} 切り捨て後の数値
 */
function truncate(num) {
    return Math.floor(num * 10000) / 10000;
}

/**
 * 相次相続控除に関連するすべての値を計算します。
 * @param {object} data - getFormDataから返されるフォームデータ。
 * @returns {object} 計算結果。
 */
export function calculateAll(data) {
    const yearsPassed = calculateYearsBetween(data.firstInheritanceDate, data.secondInheritanceDate);

    // A: 前の相続で今回の被相続人が納付した相続税額
    const A = data.previousTaxAmount || 0;
    // B: 前の相続で今回の被相続人が取得した財産の価額
    const B = data.previousAssetValue || 0;
    // C: 今回の相続で全員が取得した純資産価額の合計
    const C = data.totalAssetValue || 0;
    
    let totalDeduction = 0;
    const heirResults = [];

    // 計算の基本条件をチェック
    // 経過年数が10年以上、または前の相続の財産価額が相続税額以下の場合、控除は適用されない
    if (yearsPassed >= 10 || yearsPassed < 0 || B <= A) {
        data.heirs.forEach(heir => {
            heirResults.push({
                id: heir.id,
                name: heir.name,
                deduction: 0
            });
        });
        return {
            yearsPassed,
            totalDeduction: 0,
            heirResults,
            error: yearsPassed >= 10 ? "期間が10年を超えているため、控除対象外です。" : null
        };
    }

    // 計算式の共通部分
    // C / (B - A) の比率は1を超えることはない
    const b_minus_a = B - A;
    const c_div_b_minus_a = (C > 0 && b_minus_a > 0) ? Math.min(1, C / b_minus_a) : 0;
    const time_ratio = (10 - yearsPassed) / 10;
    
    const baseDeduction = A * c_div_b_minus_a * time_ratio;

    data.heirs.forEach(heir => {
        // D: 各相続人が取得した財産の価額
        const D = heir.assetValue || 0;
        let heirDeduction = 0;

        // ステータスが「法定相続人」の場合のみ計算
        if (heir.status === '法定相続人' && C > 0 && D > 0) {
            const heir_ratio = D / C;
            heirDeduction = baseDeduction * heir_ratio;
        }

        totalDeduction += heirDeduction;
        heirResults.push({
            id: heir.id,
            name: heir.name,
            deduction: heirDeduction
        });
    });

    return {
        yearsPassed,
        totalDeduction,
        heirResults,
        error: null
    };
}
