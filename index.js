const express = require('express');
const fs = require('fs');
const multer = require('multer');
const path = require('path');
const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'files')
    },
    filename: (req, file, cb) => {
        let originalname = file.originalname.split('.');
        cb(null, originalname.slice(0, originalname.length - 1).join()
        + '-' + (new Date()).toISOString() + '.' + originalname[originalname.length - 1]);
    }
});
const upload = multer({
    storage: fileStorage
});

const app = express();
app.use(express.json());

app.get('/', (req, res, next) => {
    let info = [
        'GET / to see this information.',
        'GET /files to list all files available',
        'POST /files to create a new file',
        'GET /files/<FILE_NAME> to download a file',
        'DELETE /files/<FILE_NAME> to delete a file'
    ];
    
    res.json({
        status: 200,
        message: 'success',
        data: info
    });    
});

app.get('/files', (req, res, next) => {
    res.json({
        status: 200,
        message: 'success',
        data: getAllFiles('files')
    });
});

app.post('/files', upload.single('file'), (req, res, next) => {
    if(!req.file) {
        let error = new Error('no file specified');
        error.status = 400;
        return next(error);
    }
    res.json({
        status: 200,
        message: 'success',
        data: req.file.filename || null
    });
});

app.get('/files/:name', (req, res, next) => {
    const filePath = path.join(__dirname, 'files', req.params.name);
    let stream;
    stream = fs.createReadStream(filePath);

    stream.on('error', (err) => {
        if(err.code === 'ENOENT') {
            let error = new Error('file does not exist');
            error.status = 404;
            return next(error);
        }
        return next(new Error('something went wrong'));
    });
    res.setHeader(
        'Content-Disposition',
        'attachment: filename="' + req.params.name + '"'
    );
    stream.pipe(res);
});

app.delete('/files/:name', (req, res, next) => {
    try {
        fs.rmSync(path.join(__dirname, 'files', req.params.name));
        res.json({
            status: 200,
            message: 'success',
            data: req.params.name
        });
    } catch(err) {
        if(err.code === 'ENOENT') {
            let error = new Error('file does not exist');
            error.status = 404;
            return next(error);
        }
        return next(new Error('something went wrong'));
    }
});

app.use('*', (req, res, next) => {
    let error = new Error('resource not found');
    error.status = 404;
    next(error);
});

app.use((error, req, res, next) => {
    res.status(error.status || 500).json({
        status: error.status || 500,
        message: error.message || 'something went wrong',
        data: null
    });
});

function getAllFiles(dir) {
    const files = fs.readdirSync(path.join(__dirname, 'files'));
    return files;
};

app.listen(5000, () => {
    console.log('File server running');
});