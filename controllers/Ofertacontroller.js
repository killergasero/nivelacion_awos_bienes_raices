import { Propiedad, Mensaje } from '../models/index.js'
import { validationResult } from 'express-validator'
import { esVendedor } from '../helpers/index.js'

const enviarOferta = async (req, res) => {
    const { id } = req.params
    const propiedad = await Propiedad.findByPk(id)

    if(!propiedad) {
        return res.redirect('/404')
    }

    let resultado = validationResult(req)

    if(!resultado.isEmpty()) {
        return res.render('propiedades/mostrar', {
            propiedad,
            pagina: propiedad.titulo,
            csrfToken: req.csrfToken(),
            usuario: req.usuario,
            esVendedor: esVendedor(req.usuario?.id, propiedad.usuarioId),
            errores: resultado.array()
        })
    }

    const { mensaje, oferta } = req.body

    await Mensaje.create({
        mensaje,
        oferta: oferta || null,  
        propiedadId: id,
        usuarioId: req.usuario.id
    })

    res.render('propiedades/mostrar', {
        propiedad,
        pagina: propiedad.titulo,
        csrfToken: req.csrfToken(),
        usuario: req.usuario,
        esVendedor: esVendedor(req.usuario?.id, propiedad.usuarioId),
        enviado: true
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
    enviarOferta,
    aceptarOferta,
    rechazarOferta
}