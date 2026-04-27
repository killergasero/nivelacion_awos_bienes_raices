import multer from 'multer'
import path from 'path'
import { generarId } from '../helpers/tokens.js'

const tiposPermitidos = ['image/png', 'image/jpeg', 'image/jpg']

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, path.resolve('public/uploads'))
    },
    filename: function(req, file, cb) {
        cb(null, `${generarId()}${path.extname(file.originalname).toLowerCase()}`)
    }
})

const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    fileFilter: function(req, file, cb) {
        if(tiposPermitidos.includes(file.mimetype)) {
            cb(null, true)
        } else {
            cb(new Error('Formato de archivo no válido. Solo se permiten imágenes PNG y JPG'))
        }
    }
})

const subirImagen = (req, res, next) => {
    upload.single('imagen')(req, res, function(error) {
        if(error instanceof multer.MulterError) {
            if(error.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ mensaje: 'La imagen es demasiado pesada. Máximo 5MB' })
            }

            return res.status(400).json({ mensaje: error.message })
        }

        if(error) {
            return res.status(400).json({ mensaje: error.message })
        }

        next()
    })
}

export default subirImagen
