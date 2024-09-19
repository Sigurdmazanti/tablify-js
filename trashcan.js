function validateMIME(file) {
    if (mimeTypes.includes(file.type)) {
        return true;
    }
    // frontend error?
    throw new Error('Incorrect MIME type.');
}

function validateExtension(file) {

    const fileExtension = file.name.split('.').pop().toLowerCase();
    if(fileExtension && fileExtensions.includes(fileExtension)) {
        return true;
    }
    // frontend error?
    throw new Error('Incorrect file extension.');
}

const fileExtensions = [
    'xls', 'xlsx'
];

const mimeTypes = [
    'application/vnd.ms-excel', // .xls
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
];