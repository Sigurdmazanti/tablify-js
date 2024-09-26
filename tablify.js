// TO DO:
// FIRST ROW OPTION = HEADER ?
// STICKY HEADER ?
// DESTROY / RE-RENDER?
// MAX CELL SIZE/ROW SIZE 
// ARIA-LABELS?
// ENTER ID
// MAX FILE SIZE
// XML
// CSV
// JSON
// GOOGLE SHEETS + FETCH ?
// PAGINATION

// Use-cases:
// 1. Edit excel sheets in-browser, and export them back
// 2. Generate a table layout quickly
// 3. Display table with fetched data from REST API/local file/server file etc.

// TODO:
// Find a better way to organize data, if header is missing. sorting first is inefficient.


// 'application/vnd.openxmlformats-officedocument.spreadsheetml.template' // .xltx
// 'application/vnd.ms-excel.template.macroenabled.12', // .xltm
// 'application/vnd.oasis.opendocument.spreadsheet', // .ods
// 'application/vnd.ms-excel.sheet.binary.macroenabled.12', // .xlsb
// 'application/vnd.ms-excel.sheet.macroenabled.12', // .xlsm

// Tablify function library
(function () {
    function tablify(input, opts) {
        if (input.type !== 'file') {
            // frontend error?
            throw new Error('Input must be of type "file".');
        }
        if (!opts.container) {
            throw new Error('Missing container for HTML output.');
        }        

        input.addEventListener('change', handleUpload);
        
        const _defaultOpts = {
            container: '', // CSS selector or HTML element. required
            tableId: 'tablify-table',
            includeColumnName: true, // displays column names/numbers
            includeRowName: true, // displays row names/numbers
            includeCellData: false, // adds data-cell to each cell
            isEditable: true, // allows celldata to be modified
            isHoverableRow: true, // adds a gradient background over an entire row
            isExportable: true, // true || false
            exportBtn: '' // only works if isExportable = true. CSS selector or HTML element. Appends after container.
        }

        opts = Object.assign({}, _defaultOpts, opts);

        
        const _optsOutputs = {
            includeColumnClass: opts.includeColumnName === true ? 'include-col' : '',
            includeRowClass: opts.includeRowName === true ? 'include-row' : '',
            editable: opts.isEditable === true ? 'contenteditable="true"' : '',
            hoverable: opts.isHoverableRow === true ? 'data-hoverable-row' : '',
            container: opts.container instanceof HTMLElement ? opts.container : document.querySelector(opts.container),
            tableId: `id="${opts.tableId}"`,
            row: (i = false) => {
                if(i===false) return '';
                return opts.includeRowName ? `data-row-name="${i}"` : '';
            },
            cell: (cell) => {
                if(!opts.includeCellData) { return '' }
                return `data-cell="${cell}"`
            },
            exportBtn: () => {
                if (!opts.isExportable) { return false }
                if (opts.exportBtn === '') { return generateExportButton(_optsOutputs.container) }
                if (opts.exportBtn instanceof HTMLElement) {  return opts.exportBtn }
                if (document.querySelector(opts.exportBtn)) { return opts.exportBtn }
            }
        }
        
        function handleUpload() {
            const self = this;
            const file = self.files[0];
        
            if (file) {
                const reader = new FileReader();
        
                reader.onload = function(e) {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    
                    generateTable(workbook);
                };
                reader.readAsArrayBuffer(file);
            }
        }

        function generateTable(workbook) {
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const columns = [];
            const columnLookup = {};
        
            const tBody = ['<tbody>'];
            const leftRowMarkup = [];
            const topColumnMarkup = [];

            if (opts.includeRowName) {
                leftRowMarkup.push('<div class="row-numbers"><div class="row-number-container">');
            }
            if (opts.includeColumnName) {
                topColumnMarkup.push('<div class="column-names"><div class="column-name-container">');
            }
            
            let currentRow = 0;
            const keys = Object.keys(sheet).sort((a, b) => {
                const colA = extractCharacters(a);
                const colB = extractCharacters(b);
                
                if (colA < colB) return -1;
                if (colA > colB) return 1;
        
                const rowA = parseInt(extractNumber(a), 10);
                const rowB = parseInt(extractNumber(b), 10);
                return rowA - rowB;
            });
            
        
            for (const key of keys) {
                const cell = sheet[key];
        
                if(key === '!ref' || key === '!margins') {
                    continue;
                }
        
                const charOnly = extractCharacters(key);
                const rowNum = parseInt(extractNumber(key), 10);
        
                // Add for headers
                if (!columnLookup[charOnly]) {
                    columns.push({'col': charOnly, 'val': sheet[key]['v']});
                    columnLookup[charOnly] = true;
                }
        
                // First row is used as headers
                if(rowNum === 1) {
                    lastCol = charOnly;
                    continue;
                }
        
                // Add rows
                if (currentRow !== rowNum) {
                    if(currentRow !== 0) {
                        tBody.push('</tr>');
                    }
                    tBody.push(`<tr ${_optsOutputs.hoverable} ${_optsOutputs.row(rowNum)}>`);
                    if(opts.includeRowName) {
                        leftRowMarkup.push(`<div>${rowNum}</div>`);
                    }
        
                    columns.forEach(col => {
                        const i = col.col + rowNum;
                        const v = sheet[i] ? sheet[i]['v'] : '';
                        const t = sheet[i] ? sheet[i]['t'] : '';
                        tBody.push(`<td data-value-type="${t}" ${_optsOutputs.editable} ${_optsOutputs.cell(i)}>${v}</td>`);
                    });
                    
        
                    currentRow = rowNum;
                }
            }
            
            if (opts.includeColumnName) {
                for (let i = 0; i < columns.length; i++) {
                    topColumnMarkup.push(`<div>${columns[i].col}</div>`);
                }
                topColumnMarkup.push('</div></div>');
            }

            if (opts.includeRowName) {
                leftRowMarkup.push('</div></div>');
            }
            
            
            const tHead = generateTableHead(columns, Object.keys(sheet).length);
            const container = _optsOutputs.container;
            container.classList.add('tablify-container');
            if (opts.isExportable) {
                _optsOutputs.exportBtn().addEventListener('click', () => handleExport(opts.tableId, sheetName));
            }
            if (opts.includeColumnName) {
                container.classList.add(_optsOutputs.includeColumnClass);
            }
            if(opts.includeRowName) {
                container.classList.add(_optsOutputs.includeRowClass);
            }

            // ${leftRowMarkup.join('')}
            // ${topColumnMarkup.join('')}

            const html = `
            <table
                class="tablify-table"
                ${_optsOutputs.tableId}>
                ${tHead.join('')}
                ${tBody.join('')}
            </table>`;
            
            container.innerHTML = html;
        }

        function generateTableHead(cols, length) {
            
            const tHead = ['<thead>'];
            tHead.push(`<tr ${_optsOutputs.hoverable}>`);

            if(opts.includeRowName) {
                const digits = getDigitsAmount(length);
                tHead.push(`<th class="row-col-span" data-digits="${digits}">1</th>`);
            }

            for (let i = 0; i < cols.length; i++) {
                tHead.push(`<th ${_optsOutputs.editable} data-col="${cols[i].col}">${cols[i].val}</th>`);
            }
            tHead.push('</tr></thead>');
        
            return tHead;
        }

        function handleExport(tableId, sheetName) {
            const table = document.getElementById(tableId);
            const workbook = XLSX.utils.table_to_book(table, { sheet: sheetName });
            XLSX.writeFile(workbook, 'exported_table.xlsx');
        }
        /**
         * Creates a button for exporting data to an Excel file and appends it after the specified container.
         *
         * @param {HTMLElement} container - The HTML element after which the export button will be inserted.
         * @returns {HTMLElement} The created button element.
         */
        function generateExportButton(container) {
            const btn = document.createElement('button');
            btn.innerText = 'Export table';
            btn.type = 'button';
            container.insertAdjacentElement('afterend', btn);
            return btn;
        }
    }

    /**
     * Extracts the non-numeric characters from a string.
     *
     * @param {string} string - The input string from which digits will be removed.
     * @returns {string} The string with all numeric characters removed.
     */
    function extractCharacters(string) {
        return string.replace(/\d+/g, '');
    }

    /**
     * Extracts the numeric characters from a string.
     *
     * @param {string} string - The input string from which digits will be removed.
     * @returns {string} The string with only the numeric characters.
     */
    function extractNumber(string) {
        return string.match(/\d+/);
    }

    /**
     * Calculates the number of digits in a given number.
     *
     * @param {number} num - The input number for which the digit count will be calculated.
     * @returns {number} The number of digits in the input number.
     *
     * @example
     * getDigitsAmount(12345); // 5
     * getDigitsAmount(0);     // 1
     * getDigitsAmount(-987);  // 3
     */
    function getDigitsAmount(num) {
        if (num === 0) return 1; // Special case for zero
        return Math.floor(Math.log10(Math.abs(num))) + 1;
    }


    function displayMessage(message) {

    }

    HTMLInputElement.prototype.tablify = function (opts) {
        tablify(this, opts);
    };
})();


document.getElementById('tablify').tablify({
    container: '#container',
});