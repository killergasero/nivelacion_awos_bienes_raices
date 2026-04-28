import { Propiedad, Mensaje } from '../models/index.js'
import { validationResult } from 'express-validator'

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
            esVendedor: false,
            errores: resultado.array()
        })
    }

    const { mensaje, oferta } = req.body
    const { id: propiedadId } = req.params
    const { id: usuarioId } = req.usuario

    await Mensaje.create({
        mensaje,
        oferta: oferta || null,  
        propiedadId,
        usuarioId
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

export {
    enviarOferta
}