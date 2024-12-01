document.addEventListener('DOMContentLoaded', function() {
    // Inisialisasi CKEditor
    ClassicEditor
    .create(document.querySelector('#editor'), {
        toolbar: [
            'heading', '|', 
            'bold', 'italic', 
            'link', 'bulletedList', 
            'numberedList', 'blockQuote'
        ]
    })
    .then(editor => {
        // Ambil elemen form
        const emailForm = document.getElementById('emailForm');
        document.getElementById('attachment').addEventListener('change', function(event) {
            const file = event.target.files[0];
            
            if (file) {
                // Daftar ekstensi file yang sering digunakan
                const allowedExtensions = [
                    'pdf', 'docx', 'doc', 'xlsx', 'xls', 
                    'pptx', 'ppt', 'txt', 'csv', 
                    'jpg', 'jpeg', 'png', 'gif', 
                    'mp4', 'avi', 'mov', 'mkv', 
                    'zip', 'rar', '7z'
                ];
        
                // Dapatkan ekstensi file
                const fileExtension = file.name.split('.').pop().toLowerCase();
                const fileSize = file.size; // dalam bytes
                const maxSize = 25 * 1024 * 1024; // 25MB
        
                // Fungsi untuk mendapatkan tipe file yang lebih ramah
                const getFileType = (extension) => {
                    const types = {
                        'pdf': 'PDF Document',
                        'docx': 'Word Document',
                        'doc': 'Word Document',
                        'xlsx': 'Excel Spreadsheet',
                        'xls': 'Excel Spreadsheet',
                        'pptx': 'PowerPoint Presentation',
                        'ppt': 'PowerPoint Presentation',
                        'txt': 'Text File',
                        'csv': 'CSV File',
                        'jpg': 'JPEG Image',
                        'jpeg': 'JPEG Image',
                        'png': 'PNG Image',
                        'gif': 'GIF Image',
                        'mp4': 'MP4 Video',
                        'avi': 'AVI Video',
                        'mov': 'MOV Video',
                        'mkv': 'MKV Video',
                        'zip': 'ZIP Archive',
                        'rar': 'RAR Archive',
                        '7z': '7Z Archive'
                    };
                    return types[extension] || 'File';
                };
        
                // Validasi ekstensi
                if (!allowedExtensions.includes(fileExtension)) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Tipe File Tidak Didukung',
                        html: `
                            File yang Anda unggah tidak didukung.<br>
                            Ekstensi file yang diizinkan:<br>
                            ${allowedExtensions.join(', ')}
                        `,
                        confirmButtonColor: '#d33'
                    });
                    // Reset input file
                    event.target.value = '';
                    return;
                }
        
                // Validasi ukuran file
                if (fileSize > maxSize) {
                    Swal.fire({
                        icon: 'warning',
                        title: 'Ukuran File Terlalu Besar',
                        html: `
                            <strong>${getFileType(fileExtension)}</strong> yang Anda pilih melebihi batas maksimal.<br>
                            Maksimal ukuran file: <strong>25 MB</strong><br>
                            Ukuran file Anda: <strong>${(fileSize / (1024 * 1024)).toFixed(2)} MB</strong>
                        `,
                        footer: 'Silakan pilih file yang lebih kecil',
                        confirmButtonColor: '#3085d6',
                        confirmButtonText: 'Mengerti'
                    });
                    // Reset input file
                    event.target.value = '';
                    return;
                }
        
                // Konfirmasi upload file jika lolos validasi
                Swal.fire({
                    icon: 'info',
                    title: 'Konfirmasi Upload File',
                    html: `
                        Anda akan mengunggah:<br>
                        <strong>${getFileType(fileExtension)}</strong><br>
                        Nama: <strong>${file.name}</strong><br>
                        Ukuran: <strong>${(fileSize / (1024 * 1024)).toFixed(2)} MB</strong>
                    `,
                    showCancelButton: true,
                    confirmButtonColor: '#3085d6',
                    cancelButtonColor: '#d33',
                    confirmButtonText: 'Ya, Upload',
                    cancelButtonText: 'Batal'
                }).then((result) => {
                    if (!result.isConfirmed) {
                        // Reset input file jika dibatalkan
                        event.target.value = '';
                    }
                });
            }
        });

        // Handler submit form
        emailForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const form = new FormData(this);
            const attachmentFile = form.get('attachment');

            // Validasi ukuran file saat submit (tambahan)
            if (attachmentFile && attachmentFile.size > 25 * 1024 * 1024) {
                Swal.fire({
                    icon: 'error',
                    title: 'File Terlalu Besar',
                    text: 'Ukuran file maksimal adalah 25MB',
                    confirmButtonColor: '#3085d6'
                });
                return;
            }

            // Validasi Username
            const Username = form.get('Username');
            if (!Username || Username.trim() === '') {
                Swal.fire({
                    icon: 'error',
                    title: 'Username Kosong',
                    text: 'Mohon masukkan Username',
                    confirmButtonColor: '#3085d6'
                });
                return;
            }

            // Validasi Email
            const recipients = form.get('recipients');
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const emails = recipients.split(',').map(email => email.trim());

            const invalidEmails = emails.filter(email => !emailRegex.test(email));
            if (invalidEmails.length > 0) {
                Swal.fire({
                    icon: 'error',
                    title: 'Email Tidak Valid',
                    text: `Email berikut tidak valid: ${invalidEmails.join(', ')}`,
                    confirmButtonColor: '#3085d6'
                });
                return;
            }

            // Validasi Pesan
            const message = editor.getData();
            if (!message || message.trim() === '') {
                Swal.fire({
                    icon: 'error',
                    title: 'Pesan Kosong',
                    text: 'Mohon tulis pesan Anda',
                    confirmButtonColor: '#3085d6'
                });
                return;
            }

            // Set pesan dari editor
            form.set('message', message);

            // Tampilkan loading
            Swal.fire({
                title: 'Please wait 😊',
                html: 'Sending processing.....',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            try {
                const response = await fetch('/send-email', {
                    method: 'POST',
                    body: form
                });

                if (response.ok) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Success',
                        html: 'Thankyou for using Easy Faster Mailer 😊👋',
                        confirmButtonColor: '#3085d6'
                    }).then(() => {
                        this.reset();
                        editor.setData('');
                    });
                } else {
                    const errorText = await response.text();
                    throw new Error(errorText);
                }
            } catch (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Pengiriman Gagal',
                    text: error.message || 'Terjadi kesalahan saat mengirim email.',
                    confirmButtonColor: '#d33'
                });
            }
        });
    })
    .catch(error => {
        console.error('Error initializing CKEditor:', error);
    });
});
// menambahkan fungsi pengecekkan file