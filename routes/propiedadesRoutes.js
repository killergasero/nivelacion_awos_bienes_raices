import express from "express"
import { body } from 'express-validator'
import { 
    admin, crear, guardar, agregarImagen, almacenarImagen, editar, guardarCambios, 
    eliminar, cambiarEstado, mostrarPropiedad, enviarMensaje, verMensajes,
    aceptarOferta, rechazarOferta 
} from '../controllers/propiedadController.js'
import protegerRuta from "../middleware/protegerRuta.js"
import subirImagen from '../middleware/subirImagen.js'
import identificarUsuario from "../middleware/identificarUsuario.js"

const router = express.Router()

router.get('/mis-propiedades', protegerRuta, admin)
router.get('/propiedades/crear', protegerRuta, crear)
router.post('/propiedades/crear', 
    protegerRuta,
    body('titulo').notEmpty().withMessage('El Titulo es Obligatorio'),
    body('descripcion').notEmpty().withMessage('La Descripción es obligatoria').isLength({ max: 200 }),
    body('categoria').isNumeric(),
    body('precio').isNumeric(),
    body('habitaciones').isNumeric(),
    body('estacionamiento').isNumeric(),
    body('wc').isNumeric(),
    body('lat').notEmpty(),
    guardar
)

router.get('/propiedades/agregar-imagen/:id', protegerRuta, agregarImagen)
router.post('/propiedades/agregar-imagen/:id', protegerRuta, subirImagen, almacenarImagen)

router.get('/propiedades/editar/:id', protegerRuta, editar)
router.post('/propiedades/editar/:id', 
    protegerRuta,
    body('titulo').notEmpty(),
    body('descripcion').notEmpty(),
    body('categoria').isNumeric(),
    body('precio').isNumeric(),
    body('habitaciones').isNumeric(),
    body('estacionamiento').isNumeric(),
    body('wc').isNumeric(),
    body('lat').notEmpty(),
    guardarCambios
)

router.post('/propiedades/eliminar/:id', protegerRuta, eliminar)
router.put('/propiedades/:id', protegerRuta, cambiarEstado)

router.get('/propiedad/:id', identificarUsuario, mostrarPropiedad)
router.post('/propiedad/:id', 
    identificarUsuario, 
    body('mensaje').isLength({min: 20}), 
    enviarMensaje
)

router.get('/mensajes/:id', protegerRuta, verMensajes)
router.post('/mensajes/aceptar/:id', protegerRuta, aceptarOferta)
router.post('/mensajes/rechazar/:id', protegerRuta, rechazarOferta)

export default router