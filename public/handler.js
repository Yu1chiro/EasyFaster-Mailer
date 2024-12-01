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
        const attachmentInput = document.getElementById('attachment');

        // Validasi ukuran file sebelum submit
        attachmentInput.addEventListener('change', function(event) {
            const file = event.target.files[0];
            const maxSize = 25 * 1024 * 1024; // 25MB

            if (file) {
                if (file.size > maxSize) {
                    Swal.fire({
                        icon: 'error',
                        title: 'File Terlalu Besar',
                        text: 'Ukuran file maksimal adalah 25MB',
                        confirmButtonColor: '#3085d6'
                    });
                    // Reset input file
                    event.target.value = '';
                }
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