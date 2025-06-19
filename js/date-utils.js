'use strict';

/**
 * 2つの日付文字列間の経過年数を計算します。1年未満は切り捨てます。
 * @param {string} startDateStr - 開始日 (YYYY-MM-DD).
 * @param {string} endDateStr - 終了日 (YYYY-MM-DD).
 * @returns {number} 経過年数。日付が無効な場合は-1を返します。
 */
export function calculateYearsBetween(startDateStr, endDateStr) {
    if (!startDateStr || !endDateStr) {
        return -1;
    }

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || startDate > endDate) {
        return -1;
    }

    let years = endDate.getFullYear() - startDate.getFullYear();
    const tempDate = new Date(startDate.getTime());
    tempDate.setFullYear(startDate.getFullYear() + years);

    if (tempDate > endDate) {
        years--;
    }

    return Math.max(0, years);
}
