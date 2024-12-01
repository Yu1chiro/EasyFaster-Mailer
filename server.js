import express from 'express';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Solusi untuk __dirname di ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Konfigurasi dotenv
dotenv.config();

const app = express();

// Konfigurasi multer untuk upload
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 25 * 1024 * 1024 }, // Batasan 25MB
    fileFilter: (req, file, cb) => {
        if (file.size > 25 * 1024 * 1024) {
            return cb(new Error('Ukuran file maksimal 25MB'), false);
        }
        cb(null, true);
    }
});


// Middleware untuk parsing form
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware untuk file statis
app.use(express.static(path.join(__dirname, 'public')));

// Konfigurasi transporter email
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
    }
});

// Rute untuk halaman utama
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Middleware untuk header cache control
app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    next();
});

// Fungsi untuk menyimpan file sementara (untuk Vercel)
const saveTemporaryFile = (buffer, originalname) => {
    const tempDir = path.join(__dirname, 'temp');
    
    // Buat direktori temp jika tidak ada
    if (!fs.existsSync(tempDir)){
        fs.mkdirSync(tempDir);
    }
    
    const filename = `${Date.now()}-${originalname}`;
    const filepath = path.join(tempDir, filename);
    
    fs.writeFileSync(filepath, buffer);
    return filepath;
};

// Rute untuk mengirim email
app.post('/send-email', upload.single('attachment'), (req, res) => {
    const { Username, recipients, subject, message } = req.body;
    const attachmentFile = req.file;

    // Validasi input
    if (!Username || !recipients || !subject || !message) {
        return res.status(400).send('Semua field harus diisi');
    }

    // Persiapkan opsi email
    const mailOptions = {
        from: process.env.GMAIL_USER,
        to: recipients.split(',').map(email => email.trim()),
        subject: subject,
        html: `
            <html>
            <head>
                <style>
                    body {
                        font-family: 'Arial', sans-serif;
                        background-color: #f7f9fc;
                        color: #4a4a4a;
                        padding: 40px;
                        margin: 0;
                    }
                    .email-container {
                        background-color: #ffffff;
                        border-radius: 12px;
                        padding: 30px;
                        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
                        max-width: 600px;
                        margin: 0 auto;
                        border: 1px solid #eaeaea;
                    }
                    h2 {
                        color: #333333;
                        font-size: 15px;
                        margin-bottom: 20px;
                        font-weight: bold;
                    }
                    p {
                        line-height: 1.6;
                        font-size: 16px;
                        margin-bottom: 20px;
                    }
                    .footer {
                        font-size: 13px;
                        color: #999999;
                        text-align: center;
                        margin-top: 30px;
                        border-top: 1px solid #eaeaea;
                        padding-top: 15px;
                    }
                    .button {
                        display: inline-block;
                        background-color: #0073e6;
                        color: #ffffff;
                        text-decoration: none;
                        padding: 10px 20px;
                        border-radius: 6px;
                        font-size: 16px;
                        font-weight: bold;
                        text-align: center;
                        margin-top: 20px;
                    }
                    .button:hover {
                        background-color: #005bb5;
                    }
                </style>
            </head>
            <body>
                <div class="email-container">
                    <h2>From : Easy Faster Mailer </h2>
                    <p>Sender : <span>${Username}</span></p>
                    <p>${message}</p>
                    <div class="footer">
                        <p>© Easy Faster Mailer 2024 All rights reserved <br>
                        Let's send emails to all your users email with Easy Faster Mailer : <br>
                        <a href="">Easy Faster Mailer</a>
                        </p>
                    </div>
                </div>
            </body>
            </html>
        `,
        attachments: attachmentFile ? [{
            filename: attachmentFile.originalname,
            content: attachmentFile.buffer,
            contentType: attachmentFile.mimetype
        }] : []
    };

    // Kirim email
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Terjadi kesalahan saat mengirim email:', error);
            return res.status(500).send('Gagal mengirim email');
        }
        console.log('Email berhasil dikirim:', info.response);
        
        // Hapus file temporary jika ada
        if (attachmentFile) {
            try {
                const tempFilePath = saveTemporaryFile(attachmentFile.buffer, attachmentFile.originalname);
                fs.unlinkSync(tempFilePath);
            } catch (err) {
                console.error('Gagal menghapus file temporary:', err);
            }
        }
        
        res.send('Email berhasil dikirim');
    });
});

// Handler untuk rute yang tidak ditemukan
app.use((req, res) => {
    res.status(404).send('Halaman tidak ditemukan');
});

// Ekspor aplikasi untuk Vercel
export default app;