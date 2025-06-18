'use strict';

import { initializeUI, updateResults } from './ui.js';
import { initializeForms, getFormData, setFormData } from './form-handler.js';
import { calculateAll } from './calculator.js';
import { saveState, loadState, clearState } from './storage.js';
import { initializeFamilyTree, drawFamilyTree, resetView } from './family-tree.js';
import { calculateElapsedYears, convertToJapaneseEra } from './date-utils.js';

// Application state
let appState = {};
let originalTreeTransform = '';

/**
 * Main function to run the application.
 */
function main() {
    document.addEventListener('DOMContentLoaded', initializeApp);
}

/**
 * Initializes the entire application.
 */
function initializeApp() {
    // Initialize UI components (help modals, accordions)
    initializeUI();

    // Initialize form handling and provide a callback for when form data changes
    initializeForms(handleFormChange);

    // Set up date input listeners
    document.getElementById('firstInheritanceDate').addEventListener('change', updateElapsedYears);
    document.getElementById('secondInheritanceDate').addEventListener('change', updateElapsedYears);

    // Initialize the family tree SVG canvas
    initializeFamilyTree();

    // Set up main action button event listeners
    initializeActionButtons();

    // Add a global listener for after printing to clean up
    window.addEventListener('afterprint', cleanupAfterPrinting);

    // Load existing data from storage or set up a default state
    const savedState = loadState();
    if (savedState) {
        appState = savedState;
        setFormData(appState);
    } else {
        // Trigger an initial calculation with default empty values
        handleFormChange();
    }
    
    // Initial update for elapsed years and Japanese dates
    updateElapsedYears();
}

/**
 * Handles any change in the form inputs.
 * This function orchestrates the flow: get data -> calculate -> update UI.
 */
function handleFormChange() {
    // 1. Get current data from all form fields
    const formData = getFormData();
    
    // 2. Perform calculations
    const calculationResult = calculateAll(formData);
    
    // 3. Update the state object
    appState = {
        ...formData,
        ...calculationResult
    };

    // 4. Update the results table in the UI
    updateResults(calculationResult);

    // 5. Redraw the family tree with the new data
    const deceasedInfo = {
        deceasedName: formData.deceasedName,
        secondInheritanceDate: formData.secondInheritanceDate,
    };
    const firstDeceasedInfo = {
        relation: formData.firstDeceasedRelation,
        firstInheritanceDate: formData.firstInheritanceDate,
        // name is not collected in the form yet, can be added later
    };
    drawFamilyTree(appState.heirCalculations, deceasedInfo, firstDeceasedInfo);

    // 6. (Optional) Auto-save on change
    // saveData(); 
}

/**
 * Updates the elapsed years field based on the two inheritance date inputs.
 */
function updateElapsedYears() {
    const firstDateValue = document.getElementById('firstInheritanceDate').value;
    const secondDateValue = document.getElementById('secondInheritanceDate').value;
    
    // Update Japanese date display
    document.getElementById('firstJapaneseDate').textContent = firstDateValue ? convertToJapaneseEra(new Date(firstDateValue)) : '';
    document.getElementById('secondJapaneseDate').textContent = secondDateValue ? convertToJapaneseEra(new Date(secondDateValue)) : '';

    const { years, error } = calculateElapsedYears(firstDateValue, secondDateValue);

    if (error) {
        // Optionally, display the error to the user. For now, we'll log it.
        console.warn(error);
    }
    
    const yearsPassedInput = document.getElementById('yearsPassed');
    yearsPassedInput.value = years;
    
    // Manually trigger a form change to recalculate everything
    handleFormChange();
}

/**
 * Sets up event listeners for the main header action buttons.
 */
function initializeActionButtons() {
    /*
    document.getElementById('saveDataBtn')?.addEventListener('click', () => {
        saveState(appState);
        alert('現在の入力内容を保存しました。');
    });

    document.getElementById('loadDataBtn')?.addEventListener('click', () => {
        const loadedState = loadState();
        if (loadedState) {
            appState = loadedState;
            setFormData(appState);
            alert('保存したデータを読み込みました。');
        } else {
            alert('保存されたデータがありません。');
        }
    });
    */

    document.getElementById('resetBtn')?.addEventListener('click', () => {
        if (confirm('すべての入力内容をリセットします。よろしいですか？')) {
            clearState();
            // This will reload the page to its default state
            window.location.reload();
        }
    });

    document.getElementById('printBtn')?.addEventListener('click', () => {
        prepareForPrinting();
        // Use a small timeout to allow the DOM to update before printing
        setTimeout(() => {
            window.print();
        }, 100);
    });
}

/**
 * Prepares the page for printing by creating spans with the values of form fields.
 * These spans are styled specifically for the print media query.
 */
function prepareForPrinting() {
    // Target all input, select, and textarea elements within the form sections
    const inputs = document.querySelectorAll('.input-section .form-control, .input-section .number-input');

    inputs.forEach(input => {
        // Skip if a printable value already exists for this input
        if (input.parentNode.querySelector('.printable-value')) {
            return;
        }

        const valueSpan = document.createElement('span');
        valueSpan.className = 'printable-value';
        
        let valueText = '';
        if (input.tagName === 'SELECT') {
            valueText = input.options[input.selectedIndex].text;
        } else if (input.type === 'date' && input.value) {
            // Format date for better readability e.g. "2025年6月18日"
            const date = new Date(input.value);
            valueText = date.toLocaleDateString('ja-JP-u-ca-japanese', { year: 'numeric', month: 'long', day: 'numeric' });
        } else if (input.classList.contains('number-input')) {
            valueText = `${Number(input.value).toLocaleString()} 円`;
        }
         else {
            valueText = input.value || '(未入力)';
        }
        
        valueSpan.textContent = valueText;
        // Insert the span right after the input/select element
        input.parentNode.insertBefore(valueSpan, input.nextSibling);
    });

    // Also handle the readonly yearsPassed input separately if it's not a .form-control
    const yearsPassedInput = document.getElementById('yearsPassed');
    if (yearsPassedInput && !yearsPassedInput.parentNode.querySelector('.printable-value')) {
        const yearsSpan = document.createElement('span');
        yearsSpan.className = 'printable-value';
        yearsSpan.textContent = `${yearsPassedInput.value} 年`;
        yearsPassedInput.parentNode.insertBefore(yearsSpan, yearsPassedInput.nextSibling);
    }

    // --- New code for family tree scaling ---
    const treeSvgGroup = document.querySelector('#familyTreeSvg g');
    if (treeSvgGroup) {
        originalTreeTransform = treeSvgGroup.getAttribute('transform') || '';
        // Now call the exported resetView function to fit the tree to the print-sized container
        resetView();
    }
}

/**
 * Cleans up the DOM by removing the elements that were added for printing.
 */
function cleanupAfterPrinting() {
    const valueSpans = document.querySelectorAll('.printable-value');
    valueSpans.forEach(span => span.remove());

    // --- New code for restoring family tree ---
    const treeSvgGroup = document.querySelector('#familyTreeSvg g');
    if (treeSvgGroup && originalTreeTransform) {
        treeSvgGroup.setAttribute('transform', originalTreeTransform);
        originalTreeTransform = ''; // Clear it
    }
}

// Run the application
main();

