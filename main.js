// ======================================================================================
// ¡IMPORTANTE! Reemplaza esta URL con la URL de tu Web App de Google Apps Script.
// ======================================================================================
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyOKUHjPz7aUDEFVUhZm-2GFEGcICVoHuhCT3aGN_B_xRJyDTGMnFayY-FTj4dhgp-j9w/exec'; // <-- PEGA TU URL AQUÍ

const form = document.getElementById('registro-form');
const fileInput = document.getElementById('archivo');

/**
 * Función centralizada para enviar los datos al servidor y manejar la respuesta.
 * @param {Object} data - El objeto con todos los datos del formulario a enviar.
 */
const sendData = (data) => {
    fetch(SCRIPT_URL, {
        method: 'POST',
        body: new URLSearchParams(data)
    })
    .then(res => res.json())
    .then(result => {
        if (result.success) {
            Swal.fire({
                icon: 'success',
                title: '¡Registro Exitoso!',
                html: `Tu ID de registro es: <strong>${result.id}</strong>`,
                background: '#fff',
                color: '#333'
            });
            form.reset();
            form.classList.remove('was-validated');
        } else {
            Swal.fire({ icon: 'error', title: 'Error al Registrar', text: result.message, background: '#fff', color: '#333' });
        }
    })
    .catch(error => {
        Swal.fire({ icon: 'error', title: 'Error de Conexión', text: 'No se pudo enviar el registro. Verifica tu conexión e inténtalo de nuevo.', background: '#fff', color: '#333' });
        console.error('Error:', error);
    });
};

// Evento que se dispara al intentar enviar el formulario
form.addEventListener('submit', (e) => {
    e.preventDefault();

    if (!form.checkValidity()) {
        Swal.fire({ icon: 'error', title: 'Formulario Incompleto', text: 'Por favor, completa todos los campos requeridos.' });
        form.classList.add('was-validated');
        return;
    }

    Swal.fire({
        title: 'Enviando Registro...',
        html: 'Por favor, espere un momento.',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
    });

    const file = fileInput.files[0];
    const formData = new FormData(form);
    const data = {};
    formData.forEach((value, key) => (data[key] = value));

    // Lógica para manejar el archivo opcional:
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            data.archivo = event.target.result.split(',')[1];
            data.mimeType = file.type;
            data.nombreArchivo = file.name;
            sendData(data); // Envía los datos CON el archivo
        };
        reader.onerror = () => {
            Swal.fire('Error', 'No se pudo procesar el archivo adjunto.', 'error');
        };
        reader.readAsDataURL(file);
    } else {
        sendData(data); // Envía los datos SIN el archivo
    }
});