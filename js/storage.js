'use strict';

import { getFormData, setFormData } from './form-handler.js';

const STORAGE_KEY = 'succeedingInheritanceSimulatorData';

/**
 * フォームデータをローカルストレージに保存します。
 * @param {object} data - 保存するフォームデータオブジェクト。
 */
export function saveData(data) {
    try {
        const dataString = JSON.stringify(data);
        localStorage.setItem(STORAGE_KEY, dataString);
        console.log('データを保存しました。');
    } catch (e) {
        console.error('データの保存に失敗しました:', e);
    }
}

/**
 * フォームデータをローカルストレージから読み込みます。
 * @returns {object | null} 読み込んだデータオブジェクト。データがない場合はnull。
 */
export function loadData() {
    try {
        const dataString = localStorage.getItem(STORAGE_KEY);
        if (dataString === null) {
            return null;
        }
        return JSON.parse(dataString);
    } catch (e) {
        console.error('データの読み込みに失敗しました:', e);
        return null;
    }
}

/**
 * 保存されているデータを消去します。
 */
export function resetData() {
    try {
        localStorage.removeItem(STORAGE_KEY);
        console.log('データをリセットしました。');
    } catch (e) {
        console.error('データのリセットに失敗しました:', e);
    }
}

/**
 * ストレージ関連のボタン（保存・読込・リセット）のイベントリスナーを初期化します。
 * @param {function} onDataChange - データの読込・リセット後にUIを更新するためのコールバック関数。
 */
export function initializeStorage(onDataChange) {
    /*
    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            const formData = getFormData(); // This needs getFormData
            saveData(formData);
            alert('入力内容を保存しました。');
        });
    }

    const loadBtn = document.getElementById('loadBtn');
    if (loadBtn) {
        loadBtn.addEventListener('click', () => {
            const loadedData = loadData();
            if (loadedData) {
                setFormData(loadedData); // This needs setFormData
                alert('保存した内容を読み込みました。');
            } else {
                alert('保存されたデータがありません。');
            }
            if (onDataChange) onDataChange();
        });
    }
    */

    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (confirm('入力内容をすべてリセットしますか？')) {
                resetData();
                window.location.reload();
            }
        });
    }
}
