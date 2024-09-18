// TO DO:
// FIRST ROW OPTION = HEADER ?
// STICKY HEADER ?
// MAX FILE SIZE
// XML
// CSV
// JSON
// 'application/vnd.openxmlformats-officedocument.spreadsheetml.template' // .xltx
// 'application/vnd.ms-excel.template.macroenabled.12', // .xltm
// 'application/vnd.oasis.opendocument.spreadsheet', // .ods
// 'application/vnd.ms-excel.sheet.binary.macroenabled.12', // .xlsb
// 'application/vnd.ms-excel.sheet.macroenabled.12', // .xlsm
const fileExtensions = [
    'xls', 'xlsx'
];

const mimeTypes = [
    'application/vnd.ms-excel', // .xls
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
];

let firstRowHeader = true;
let includeColumnName = true;
let includeRowName    = true;

const input = document.getElementById('tablify');
const container = document.getElementById('container');

function generateTableHead(cols) {
    const tHead = ['<thead>'];

    if (includeColumnName) {
        tHead.push('<tr>');
        if(includeRowName) {
            tHead.push('<th></th>');
        }
        for (let i = 0; i < cols.length; i++) {
            tHead.push(`<th>${cols[i].col}</th>`);
        }
        tHead.push('</tr>');
    }

    tHead.push('<tr>');
    if(includeRowName) {
        tHead.push('<th></th>');
    }
    for (let i = 0; i < cols.length; i++) {
        tHead.push(`<th>${cols[i].val}</th>`);
    }
    tHead.push('</tr></thead>');

    return tHead;
}

function validateMIME(file) {
    if (mimeTypes.includes(file.type)) {
        return true;
    }

    // TODO: throw error
    console.log('err');
    return false;
}

function validateExtension(file) {

    const fileExtension = file.name.split('.').pop().toLowerCase();
    if(fileExtension && fileExtensions.includes(fileExtension)) {
        return true;
    }

    // TODO: throw error
    console.log('err');
    return false;
}

function extractCharacters(string) {
    return string.replace(/\d+/g, '');
}

function extractNumber(string) {
    return string.match(/\d+/);
}

function handleUpload() {
    const self = this;
    const file = self.files[0];

    validateMIME(file);
    validateExtension(file);

    if (file) {
        const reader = new FileReader();

        reader.onload = function(e) {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            
            generateTable(workbook);


            // const firstSheetName = workbook.SheetNames[0];
            // const worksheet = workbook.Sheets[firstSheetName];
            // const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            // // Display the JSON data in the browser
            // console.log(jsonData);
            
        };

        // Read the file as an array buffer (binary data)
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
            tBody.push('<tr>');
            if(includeRowName) {
                tBody.push(`<td>${rowNum}</td>`);
            }

            columns.forEach(col => {
                const i = col.col + rowNum;
                const v = sheet[i] ? sheet[i]['v'] : '';
                console.log(i);
                
                tBody.push(`<td>${v}</td>`);
            });

            currentRow = rowNum;
        }
    }
    
    const tHead = generateTableHead(columns);
    
    
    const html = `<table>${tHead.join('')}${tBody.join('')}</table>`;
    // sheet.forEach(element => {
    //     console.log(sheet["A2"]);
        
    // });
    // var html = XLSX.utils.sheet_to_html(sheet);

    // console.log(sheet);
    
    document.getElementById('container').innerHTML = html;
    
    // workbook.SheetNames.forEach(sheet => {
    //     // const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[sheet], { header: 1 });
    // });
}

input.addEventListener('change', handleUpload);