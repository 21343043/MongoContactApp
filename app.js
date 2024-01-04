const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');
const {body, validationResult, check} = require('express-validator');
const methodOverride = require('method-override');


require('./utils/db');
const Contact = require('./model/contact')

const app = express();
const port = 3000;

// setup method override
app.use(methodOverride('_method'));

// setup EJS
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.use(express.static('public'));
app.use(express.urlencoded({extended: true}));

// konfigurasi flash
app.use(cookieParser('secret'));
app.use(session({
    cookie: {maxAge: 6000},
    secret: 'secret',
    resave: true,
    saveUninitialized: true,
}));
app.use(flash());

// halaman home
app.get('/', (req, res) => {
    res.render('index', {
        layout: 'layouts/main-layout',
        title: 'Halaman Home'
    });
});

// halaman about
app.get('/about', (req, res) => {
    res.render('about', {
        layout: 'layouts/main-layout',
        title: 'Halaman About'
    });
});

// halaman contact
app.get('/contact', async (req, res) => {
    const contacts = await Contact.find();

    res.render('contact', {
        layout: 'layouts/main-layout',
        title: 'Halaman Contact',
        contacts,
        msg: req.flash('msg')
    });
});

// halaman form tambah data contact
app.get('/contact/add', (req, res) => {
    res.render('add-contact', {
        layout: 'layouts/main-layout',
        title: 'Halaman Tambah Data Contact',
    });
});

// proses tambah data contact
app.post('/contact', [
    body('nama').custom(async (value) => {
        const duplikat = await Contact.findOne({nama: value});
        if(duplikat) {
            throw new Error('Nama sudah terdaftar!');
        }
        return true;
    }),
    check('email', 'Email tidak valid!').isEmail(), 
    check('nohp', 'No HP tidak valid!').isMobilePhone('id-ID')],
    (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        res.render('add-contact', {
            title: 'Form Tambah Data Contact',
            layout: 'layouts/main-layout',
            errors: errors.array(),
        });
    } else {
        Contact.insertMany(req.body)
        .then(result => {
            // kirimkan flash message
            req.flash('msg', 'Data contact berhasil ditambahkan!');
            res.redirect('/contact');
        })
        .catch(error => {
            // Tangani kesalahan jika diperlukan
            console.error(error);
            // Tambahkan logika penanganan kesalahan lainnya sesuai kebutuhan Anda
            res.status(500).send('Terjadi kesalahan saat menambahkan data contact.');
        });
    }
});

// proses delete contact
app.delete('/contact', (req, res) => {
    Contact.deleteOne({nama: req.body.nama}).then((result) => {
        req.flash('msg', 'Data contact berhasil dihapus!')
        res.redirect('/contact');
    });
});

// form ubah data contact
app.get('/contact/edit/:nama', async (req, res) => {
    const contact = await Contact.findOne({nama: req.params.nama});
    
    res.render('edit-contact', {
        layout: 'layouts/main-layout',
        title: 'Form Ubah Data Contact',
        contact
    });
});

// proses ubah data
app.put('/contact', [
    body('nama').custom(async (value, {req}) => {
        const duplikat = await Contact.findOne({nama: value});
        if(value !== req.body.oldNama && duplikat) {
            throw new Error('Nama sudah terdaftar!');
        }
        return true;
    }),
    check('email', 'Email tidak valid!').isEmail(), 
    check('nohp', 'No HP tidak valid!').isMobilePhone('id-ID')],
    (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        res.render('edit-contact', {
            title: 'Form Ubah Data Contact',
            layout: 'layouts/main-layout',
            errors: errors.array(),
            contact: req.body
        });
    } else {
        Contact.updateOne(
            {_id: req.body._id},
            {
                $set: {
                    nama: req.body.nama,
                    nohp: req.body.nohp,
                    email: req.body.email,
                }
            }
        ).then((result) => {
            // // kirimkan flash message
            req.flash('msg', 'Data contact berhasil diubah!')
            res.redirect('/contact');
        });
    }
});

// halaman detail contact
app.get('/contact/:nama', async (req, res) => {
    const contact = await Contact.findOne({nama: req.params.nama});

    res.render('detail', {
        layout: 'layouts/main-layout',
        title: 'Halaman Detail Contact',
        contact
    });
});

app.listen(port, () => {
    console.log(`Mongo Contact App | listening at http://localhost:${port}`);
});