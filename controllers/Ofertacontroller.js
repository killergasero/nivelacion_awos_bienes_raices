import { Propiedad, Mensaje, Usuario, Precio, Categoria } from '../models/index.js'
import { validationResult } from 'express-validator'
import { formatearFecha } from '../helpers/index.js'

const verMensajes = async (req, res) => {
    const { id } = req.params

    const propiedad = await Propiedad.findByPk(id, {
        include: [
            { 
                model: Mensaje, as: 'mensajes', 
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

const enviarOferta = async (req, res) => {
    const { id } = req.params
    const { mensaje, oferta } = req.body

    const propiedad = await Propiedad.findByPk(id, {
        include: [
            { model: Precio, as: 'precio' },
            { model: Categoria, as: 'categoria' }
        ]
    })

    if(!propiedad) {
        return res.redirect('/404')
    }

    let resultado = validationResult(req)

    const yaEnvioOferta = await Mensaje.findOne({
        where: {
            propiedadId: id,
            usuarioId: req.usuario.id
        }
    })

    if(yaEnvioOferta) {
        return res.render('propiedades/mostrar', {
            propiedad,
            pagina: propiedad.titulo,
            csrfToken: req.csrfToken(),
            usuario: req.usuario,
            esVendedor: false,
            errores: [{ msg: 'Ya has enviado una oferta para esta propiedad' }],
            yaEnvioOferta: true 
        })
    }

    if(!resultado.isEmpty()) {
        return res.render('propiedades/mostrar', {
            propiedad,
            pagina: propiedad.titulo,
            csrfToken: req.csrfToken(),
            usuario: req.usuario,
            esVendedor: false,
            errores: resultado.array(),
            yaEnvioOferta: false
        })
    }

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
        esVendedor: false,
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
    verMensajes,
    enviarOferta,
    aceptarOferta,
    rechazarOferta
}