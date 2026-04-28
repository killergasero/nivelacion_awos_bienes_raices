import { Propiedad, Mensaje, Usuario } from '../models/index.js'
import { validationResult } from 'express-validator'
import { esVendedor, formatearFecha } from '../helpers/index.js'

const verMensajes = async (req, res) => {
    const { id } = req.params

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

    if(propiedad.usuarioId.toString() !== req.usuario.id.toString() ) {
        return res.redirect('/mis-propiedades')
    }

    res.render('propiedades/mensajes', {
        pagina: 'Mensajes',
        mensajes: propiedad.mensajes,
        formatearFecha,
        csrfToken: req.csrfToken() 
    })
}

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

    mensaje.propiedad.publicado = false
    await mensaje.propiedad.save()

    res.redirect(`/mensajes/${mensaje.propiedadId}`)
}

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