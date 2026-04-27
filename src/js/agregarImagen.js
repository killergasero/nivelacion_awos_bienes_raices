import Dropzone from 'dropzone'

Dropzone.autoDiscover = false

const formulario = document.querySelector('#imagen')
const btnPublicar = document.querySelector('#publicar')
const tokenMeta = document.querySelector('meta[name="csrf-token"]')

if(formulario && btnPublicar && tokenMeta) {
    const token = tokenMeta.getAttribute('content')

    const dropzone = new Dropzone('#imagen', {
        dictDefaultMessage: 'Sube tus imágenes aquí',
        acceptedFiles: '.png,.jpg,.jpeg',
        maxFilesize: 5,
        maxFiles: 1,
        parallelUploads: 1,
        autoProcessQueue: false,
        addRemoveLinks: true,
        dictRemoveFile: 'Borrar Archivo',
        dictMaxFilesExceeded: 'El límite es 1 archivo',
        paramName: 'imagen',
        headers: {
            'x-csrf-token': token
        }
    })

    btnPublicar.addEventListener('click', function() {
        if(dropzone.files.length === 0) {
            alert('Debes seleccionar una imagen antes de publicar la propiedad')
            return
        }

        dropzone.processQueue()
    })

    dropzone.on('success', function() {
        window.location.href = '/mis-propiedades'
    })

    dropzone.on('error', function(file, mensaje) {
        const mensajeError = typeof mensaje === 'string'
            ? mensaje
            : mensaje?.mensaje || 'Ocurrió un error al subir la imagen'

        alert(mensajeError)

        if(file) {
            dropzone.removeFile(file)
        }
    })
}
