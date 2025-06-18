'use strict';

import { eraData } from './data.js';

/**
 * 西暦の日付を和暦の文字列に変換します。
 * @param {Date} date - 変換するDateオブジェクト。
 * @returns {string} 和暦表記の文字列（例: "令和4年1月1日"）。
 */
export function convertToJapaneseEra(date) {
    if (!date || !(date instanceof Date)) {
        return '';
    }

    for (const era of eraData) {
        if (date >= era.start) {
            const yearInEra = date.getFullYear() - era.start.getFullYear() + 1;
            const eraYearString = yearInEra === 1 ? '元' : String(yearInEra);
            return `${era.name}${eraYearString}年${date.getMonth() + 1}月${date.getDate()}日`;
        }
    }
    // どの元号にも当てはまらない場合（明治以前など）
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

/**
 * 2つの日付間の経過年数を計算します（1年未満切り捨て）。
 * @param {string | Date} startDate - 開始日。
 * @param {string | Date} endDate - 終了日。
 * @returns {{years: number, error: string | null}} 経過年数とエラーメッセージを含むオブジェクト。
 */
export function calculateElapsedYears(startDate, endDate) {
    if (!startDate || !endDate) {
        return { years: 0, error: null };
    }

    const firstDate = new Date(startDate);
    const secondDate = new Date(endDate);

    if (isNaN(firstDate.getTime()) || isNaN(secondDate.getTime())) {
         return { years: 0, error: '無効な日付形式です。' };
    }

    if (secondDate < firstDate) {
        return { years: 0, error: '2回目の相続日は1回目より後である必要があります。' };
    }

    let years = secondDate.getFullYear() - firstDate.getFullYear();
    const monthDiff = secondDate.getMonth() - firstDate.getMonth();
    const dayDiff = secondDate.getDate() - firstDate.getDate();

    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
        years--;
    }

    return { years: Math.max(0, years), error: null };
}
