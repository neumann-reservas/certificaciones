/**
 * =====================================================================================
 *                        SCRIPT PARA GESTIÓN DE REGISTROS
 * Este script funciona como el backend para uno o más formularios web.
 * Se encarga de recibir los datos, guardar archivos en Google Drive,
 * registrar la información en una Hoja de Cálculo de Google y enviar
 * un correo de confirmación al usuario.
 * =====================================================================================
 */

/**
 * Genera un número aleatorio de 4 dígitos.
 * Rellena con ceros a la izquierda si el número es menor a 1000 para asegurar 4 caracteres.
 * @returns {string} Un número aleatorio como texto de 4 dígitos.
 */
function generarNumeroRandom() {
  return String(Math.floor(Math.random() * 10000)).padStart(4, '0');
}

/**
 * Función principal que se ejecuta al recibir una solicitud POST desde el formulario web.
 * Es el punto de entrada para todos los envíos de formularios.
 * @param {Object} e - El objeto del evento que contiene todos los datos enviados por el formulario.
 *                     Los datos se acceden a través de 'e.parameter'.
 * @returns {ContentService} Una respuesta en formato JSON que el JavaScript del formulario utilizará
 *                           para saber si el proceso fue exitoso o falló.
 */
function doPost(e) {
  try {
    // -----------------------------------------------------------------------------------
    // SECCIÓN 1: CONEXIÓN CON HERRAMIENTAS DE GOOGLE
    // -----------------------------------------------------------------------------------
    
    // Conecta con la hoja de cálculo activa y selecciona la hoja específica llamada "Registros".
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Registros");
    
    // Accede a la carpeta de Google Drive donde se guardarán los archivos adjuntos.
    // Es crucial que el ID de la carpeta sea correcto.
    const folder = DriveApp.getFolderById('1nuVI8DiCxeVBxdADwj4R0NM6h5V7As2M');

    // -----------------------------------------------------------------------------------
    // SECCIÓN 2: CREACIÓN DE UN IDENTIFICADOR ÚNICO (ID)
    // -----------------------------------------------------------------------------------

    const lastRow = sheet.getLastRow();
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    // Se usa el número de la última fila como un contador incremental para evitar IDs repetidos.
    const increment = lastRow === 0 ? 1 : lastRow; 
    const randomNum = generarNumeroRandom();
    
    // Se construye el ID único combinando varios elementos para fácil identificación.
    // Formato: REG-AÑO-MES-CORRELATIVO-ALEATORIO (Ej: REG-202510-0001-5821)
    const uniqueId = `REG-${year}${month}-${String(increment).padStart(4, '0')}-${randomNum}`;

    // -----------------------------------------------------------------------------------
    // SECCIÓN 3: PROCESAMIENTO DEL ARCHIVO ADJUNTO (SI EXISTE)
    // -----------------------------------------------------------------------------------
    
    let fileUrl = ''; // Se inicializa la URL del archivo como una cadena vacía.
    
    // Se comprueba si el formulario envió los datos de un archivo.
    if (e.parameter.archivo && e.parameter.nombreArchivo) {
      // El archivo llega como texto en formato Base64. Se decodifica para reconstruir el archivo original.
      const blob = Utilities.newBlob(
        Utilities.base64Decode(e.parameter.archivo),
        e.parameter.mimeType,
        e.parameter.nombreArchivo
      );
      
      // Se crea el archivo en la carpeta de Drive definida en la Sección 1.
      const file = folder.createFile(blob);
      // Se obtiene la URL pública del archivo para guardarla en la hoja de cálculo.
      fileUrl = file.getUrl();
    }

    // -----------------------------------------------------------------------------------
    // SECCIÓN 4: GUARDADO DE DATOS EN LA HOJA DE CÁLCULO
    // -----------------------------------------------------------------------------------
    
    // Se agrega una nueva fila al final de la hoja "Registros".
    // IMPORTANTE: El orden de los elementos en este array debe coincidir exactamente
    // con el orden de las columnas en tu Hoja de Cálculo.
    sheet.appendRow([
      uniqueId,                    // Columna A: ID
      new Date(),                  // Columna B: Timestamp (fecha y hora del registro)
      e.parameter.nombres,         // Columna C: Nombres
      e.parameter.apellidos,       // Columna D: Apellidos
      e.parameter.correo,          // Columna E: Correo
      e.parameter.telefono,        // Columna F: Telefono
      e.parameter.pais,            // Columna G: Pais
      e.parameter.codigoMatricula, // Columna H: CodigoMatricula (usado también para Nivel de Inglés)
      fileUrl,                     // Columna I: UrlArchivo (quedará vacía si no se subió archivo)
      e.parameter.marca            // Columna J: Marca (el valor oculto del formulario, ej: "MadisonOK")
    ]);

    // -----------------------------------------------------------------------------------
    // SECCIÓN 5: ENVÍO DE CORREO ELECTRÓNICO DE CONFIRMACIÓN
    // -----------------------------------------------------------------------------------

    // Se construye el cuerpo del correo en formato HTML para un diseño profesional.
    // Se usan plantillas de texto (`...`) para insertar dinámicamente los datos del usuario.
    const emailHtml = `
      <!DOCTYPE html><html><head><style>
        body { font-family: Arial, sans-serif; color: #333; } .container { max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
        .header { background: #5D21D2; color: white; padding: 15px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 20px; } .label { font-weight: bold; color: #5D21D2; }
        .id-box { background: #f3e5f5; padding: 15px; border-radius: 4px; text-align: center; font-size: 1.2em; margin-bottom: 20px; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #777; }
        .info-item { margin-bottom: 10px; }
      </style></head><body><div class="container">
        <div class="header"><h2>Confirmación de Registro</h2></div>
        <div class="content">
          <p>Hola, ${e.parameter.nombres}:</p>
          <p>Hemos recibido tu registro correctamente. A continuación, te mostramos los detalles:</p>
          <div class="id-box"><strong>ID de Registro: ${uniqueId}</strong></div>
          <div class="info-item"><span class="label">Nombre Completo:</span> ${e.parameter.nombres} ${e.parameter.apellidos}</div>
          <div class="info-item"><span class="label">Correo Electrónico:</span> ${e.parameter.correo}</div>
          <div class="info-item"><span class="label">Teléfono:</span> ${e.parameter.telefono || 'No proporcionado'}</div>
          <div class="info-item"><span class="label">País:</span> ${e.parameter.pais || 'No proporcionado'}</div>
          <div class="info-item"><span class="label">Código/Nivel:</span> ${e.parameter.codigoMatricula}</div>
          ${fileUrl ? `<div class="info-item"><span class="label">Comprobante:</span> <a href="${fileUrl}">Ver Documento Adjunto</a></div>` : ''}
        </div>
        <div class="footer"><p>Este es un correo automático. Por favor, no responder.</p></div>
      </div></body></html>
    `;

    // Se utiliza el servicio MailApp de Google para enviar el correo.
    MailApp.sendEmail({
      to: e.parameter.correo,
      subject: `Registro Recibido Exitosamente - ID: ${uniqueId}`,
      htmlBody: emailHtml
    });

    // -----------------------------------------------------------------------------------
    // SECCIÓN 6: RESPUESTA AL FORMULARIO WEB
    // -----------------------------------------------------------------------------------

    // Se devuelve una respuesta JSON al script 'main.js' indicando que todo el proceso fue exitoso.
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: "Registro guardado exitosamente",
      id: uniqueId
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    // -----------------------------------------------------------------------------------
    // SECCIÓN 7: MANEJO DE ERRORES
    // -----------------------------------------------------------------------------------
    
    // Si ocurre cualquier error en el bloque 'try', se captura aquí.
    // Se registra el error en los logs de Apps Script para que puedas depurarlo.
    Logger.log(error.toString());
    
    // Se devuelve una respuesta JSON indicando que hubo un error.
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: "Ocurrió un error en el servidor: " + error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}