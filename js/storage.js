'use strict';

const STORAGE_KEY = 'souzokuSimulatorData';

/**
 * アプリケーションの状態をローカルストレージに保存します。
 * @param {object} state - 保存するアプリケーションの状態オブジェクト。
 */
export function saveState(state) {
    try {
        const stateString = JSON.stringify(state);
        localStorage.setItem(STORAGE_KEY, stateString);
        console.log('データを保存しました。');
    } catch (e) {
        console.error('データの保存に失敗しました:', e);
        alert('データの保存に失敗しました。');
    }
}

/**
 * アプリケーションの状態をローカルストレージから読み込みます。
 * @returns {object | null} 読み込んだ状態オブジェクト。データがない場合はnull。
 */
export function loadState() {
    try {
        const stateString = localStorage.getItem(STORAGE_KEY);
        if (stateString === null) {
            return null; // データがない場合はnullを返す
        }
        return JSON.parse(stateString);
    } catch (e) {
        console.error('データの読み込みに失敗しました:', e);
        alert('データの読み込みに失敗しました。');
        return null;
    }
}

/**
 * 保存されているデータを消去します。
 */
export function clearState() {
    try {
        localStorage.removeItem(STORAGE_KEY);
        console.log('データをリセットしました。');
    } catch (e) {
        console.error('データのリセットに失敗しました:', e);
    }
}
