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
            container: '', // CSS selector or HTML element
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
            editable: opts.isEditable === true ? 'contenteditable="true"' : '',
            hoverable: opts.isHoverableRow === true ? 'data-hoverable-row' : '',
            container: opts.container instanceof HTMLElement ? opts.container : document.querySelector(opts.container),
            tableId: `id="${opts.tableId}"`,
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
            
            let currentRow = 0;
        
            for (const key of Object.keys(sheet)) {
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
                    tBody.push(`<tr ${_optsOutputs.hoverable}>`);
                    if(opts.includeRowName) {
                        tBody.push(`<td>${rowNum}</td>`);
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
            
            
            const tHead = generateTableHead(columns);
            if (opts.isExportable) {
                _optsOutputs.exportBtn().addEventListener('click', () => handleExport(opts.tableId, sheetName));
            }
            const html = `<table class="tablify-table" ${_optsOutputs.tableId}>${tHead.join('')}${tBody.join('')}</table>`;
            
            _optsOutputs.container.innerHTML = html;
        }

        function generateTableHead(cols) {
            const tHead = ['<thead>'];
        
            if (opts.includeColumnName) {
                tHead.push('<tr>');
                if(opts.includeRowName) {
                    tHead.push('<th data-row-name></th>');
                }
                for (let i = 0; i < cols.length; i++) {
                    tHead.push(`<th data-column-name>${cols[i].col}</th>`);
                }
                tHead.push('</tr>');
            }
        
            tHead.push(`<tr ${_optsOutputs.hoverable}>`);
            if(opts.includeRowName) {
                tHead.push('<th>1</th>');
            }
            for (let i = 0; i < cols.length; i++) {
                tHead.push(`<th ${_optsOutputs.editable}>${cols[i].val}</th>`);
            }
            tHead.push('</tr></thead>');
        
            return tHead;
        }

        function handleExport(tableId, sheetName) {
            const table = document.getElementById(tableId);
            const workbook = XLSX.utils.table_to_book(table, { sheet: sheetName });
            console.log(workbook);
            // JSON // CSV // Sheet // Book
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

    function displayMessage(message) {

    }

    HTMLInputElement.prototype.tablify = function (opts) {
        tablify(this, opts);
    };
})();


document.getElementById('tablify').tablify({
    container: '#container',
});