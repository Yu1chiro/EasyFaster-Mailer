ClassicEditor
    .create(document.querySelector('#editor'), {
        toolbar: [
            'heading', 
            '|', 
            'bold', 
            'italic', 
            'link', 
            'bulletedList', 
            'numberedList', 
            'blockQuote'
        ]
    })
    .then(editor => {
        document.getElementById('emailForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const form = new FormData(this);
            
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
            
            form.set('message', message);
            
            Swal.fire({
                title:'Please wait 😊',
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
                        title:'Success',
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