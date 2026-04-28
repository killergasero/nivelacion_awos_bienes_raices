import { Propiedad, Mensaje, Usuario } from '../models/index.js'
import { validationResult } from 'express-validator'
import { esVendedor, formatearFecha } from '../helpers/index.js'

// 1. Método para VER los mensajes (Aquí se genera el token para la vista)
const verMensajes = async (req, res) => {
    const { id } = req.params

    // Validar que la propiedad exista
    const propiedad = await Propiedad.findByPk(id, {
        include: [
            { model: Mensaje, as: 'mensajes', 
                include: [
                    { model: Usuario.scope('eliminarPassword'), as: 'usuario' }
                ] 
            },
        ],
    })

    if(!propiedad) {
        return res.redirect('/mis-propiedades')
    }

    // Revisar que quien visita la URL es el dueño
    if(propiedad.usuarioId.toString() !== req.usuario.id.toString() ) {
        return res.redirect('/mis-propiedades')
    }

    res.render('propiedades/mensajes', {
        pagina: 'Mensajes',
        mensajes: propiedad.mensajes,
        formatearFecha,
        csrfToken: req.csrfToken() // <-- IMPORTANTE: Genera el token para los forms
    })
}

// 2. Método para ACEPTAR
const aceptarOferta = async (req, res) => {
    const { id } = req.params 

    const mensaje = await Mensaje.findByPk(id, { 
        include: [{ model: Propiedad }] 
    })
    
    if(!mensaje) {
        return res.redirect('/mis-propiedades')
    }

    if(mensaje.propiedad.usuarioId.toString() !== req.usuario.id.toString()) {
        return res.redirect('/mis-propiedades')
    }

    // Marcar como vendida / no publicada
    mensaje.propiedad.publicado = false
    await mensaje.propiedad.save()

    res.redirect(`/mensajes/${mensaje.propiedadId}`)
}

// 3. Método para RECHAZAR
const rechazarOferta = async (req, res) => {
    const { id } = req.params

    const mensaje = await Mensaje.findByPk(id, { 
        include: [{ model: Propiedad }] 
    })

    if(!mensaje) {
        return res.redirect('/mis-propiedades')
    }

    if(mensaje.propiedad.usuarioId.toString() !== req.usuario.id.toString()) {
        return res.redirect('/mis-propiedades')
    }

    await mensaje.destroy()

    res.redirect(`/mensajes/${mensaje.propiedadId}`)
}

export { 
    verMensajes,
    enviarOferta,
    aceptarOferta,
    rechazarOferta
}