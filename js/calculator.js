'use strict';

import { calculateElapsedYears } from './date-utils.js';

/**
 * 小数点以下第4位で切り捨て（トルンケート）するヘルパー関数
 * @param {number} num - 対象の数値
 * @returns {number} 切り捨て後の数値
 */
function truncate(num) {
    return Math.floor(num * 10000) / 10000;
}

/**
 * 相次相続控除額の計算を実行します。
 * @param {object} inputData - 計算に必要な入力データ。
 * @returns {object} 計算結果。
 */
export function calculateAll(inputData) {
    const { 
        firstInheritanceDate, 
        secondInheritanceDate,
        previousTaxAmount,
        previousAssetValue,
        totalAssetValue,
        heirs
    } = inputData;

    const result = {
        totalDeduction: 0,
        heirCalculations: [],
        status: '適用可',
        message: ''
    };

    // E: 経過年数の計算
    const { years: E } = calculateElapsedYears(firstInheritanceDate, secondInheritanceDate);
    
    // A: 前回の相続で納めた相続税額
    const A = previousTaxAmount;

    // B: 前回に取得した財産の価額
    const B = previousAssetValue;
    
    // C: 今回の相続財産の総額
    const C = totalAssetValue;

    // 控除の基本条件をチェック
    if (E >= 10) {
        result.status = '適用不可';
        result.message = `経過年数が10年を超えているため、相次相続控除は適用されません。（経過年数: ${E}年）`;
        result.heirCalculations = heirs.map(h => ({ ...h, deductionAmount: 0 }));
        return result;
    }
    if (A <= 0) {
        result.status = '適用不可';
        result.message = '前回の相続で納めた相続税額が0のため、相次相続控除は適用されません。';
        result.heirCalculations = heirs.map(h => ({ ...h, deductionAmount: 0 }));
        return result;
    }
    if ((B - A) <= 0) {
        result.status = '適用不可';
        result.message = '前回の相続で取得した財産の価額が、納めた相続税額以下のため、控除額は0円となります。';
        result.heirCalculations = heirs.map(h => ({ ...h, deductionAmount: 0 }));
        return result;
    }

    let totalDeduction = 0;
    const heirCalculations = heirs.map(heir => {
        let deductionAmount = 0;
        
        // D: 相続人が今回取得した財産の価額
        const D = heir.assetValue;

        // 「法定相続人」かつ取得財産がプラスの場合のみが計算対象
        if (heir.status === '法定相続人' && D > 0) {
            // 計算式の各項を計算
            
            // 1. C / (B - A) の計算 (1以上は1とする)
            const B_A_diff = B - A;
            let ratio1 = B_A_diff > 0 ? C / B_A_diff : 0;
            if (ratio1 > 1) {
                ratio1 = 1;
            }

            // 2. D / C の計算 (小数点以下第4位で切り捨て)
            let ratio2 = C > 0 ? D / C : 0;
            ratio2 = truncate(ratio2);

            // 3. (10 - E) / 10 の計算 (小数点以下第4位で切り捨て)
            let ratio3 = (10 - E) / 10;
            ratio3 = truncate(ratio3);

            // 最終的な控除額を計算
            const deduction = A * ratio1 * ratio2 * ratio3;
            
            // 計算結果は小数点以下を切り捨てる
            deductionAmount = Math.floor(deduction);
        }
        
        totalDeduction += deductionAmount;
        return {
            ...heir,
            deductionAmount
        };
    });

    result.totalDeduction = totalDeduction;
    result.heirCalculations = heirCalculations;
    
    return result;
}
