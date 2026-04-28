import { unlink } from 'node:fs/promises'
import path from 'node:path'
import { validationResult } from 'express-validator'
import { Precio, Categoria, Propiedad, Mensaje, Usuario } from '../models/index.js'
import { esVendedor, formatearFecha } from '../helpers/index.js'

const admin = async (req, res) => {
    const { pagina: paginaActual } = req.query
    const expresion = /^[1-9]$/

    if(!expresion.test(paginaActual)) {
        return res.redirect('/mis-propiedades?pagina=1')
    }

    try {
        const { id } = req.usuario
        const limit = 10
        const offset = ((paginaActual * limit) - limit)

        const [propiedades, total] = await Promise.all([
            Propiedad.findAll({
                limit,
                offset,
                where: { usuarioId : id },
                include: [
                    { model: Categoria, as: 'categoria' },
                    { model: Precio, as: 'precio' },
                    { model: Mensaje, as: 'mensajes' }
                ],
            }),
            Propiedad.count({
                where: { usuarioId : id }
            })
        ])

        res.render('propiedades/admin', {
            pagina: 'Mis Propiedades',
            propiedades,
            csrfToken: req.csrfToken(),
            paginas: Math.ceil(total / limit),
            paginaActual: Number(paginaActual),
            total,
            offset,
            limit
        })
    } catch (error) {
        console.log(error)
    }
}

const crear = async (req, res) => {
    const [categorias, precios] = await Promise.all([
        Categoria.findAll(),
        Precio.findAll()
    ])
    res.render('propiedades/crear', {
        pagina: 'Crear Propiedad',
        csrfToken: req.csrfToken(),
        categorias,
        precios,
        datos: {}
    })
}

const guardar = async (req, res) => {
    let resultado = validationResult(req)
    if(!resultado.isEmpty()) {
        const [categorias, precios] = await Promise.all([
            Categoria.findAll(),
            Precio.findAll()
        ])
        return res.render('propiedades/crear', {
            pagina: 'Crear Propiedad',
            csrfToken: req.csrfToken(),
            categorias,
            precios, 
            errores: resultado.array(),
            datos: req.body
        })
    }

    const { titulo, descripcion, habitaciones, estacionamiento, wc, calle, lat, lng, precio: precioId, categoria: categoriaId } = req.body
    const { id: usuarioId } = req.usuario
  
    try {
        const propiedadGuardada = await Propiedad.create({
            titulo, descripcion, habitaciones, estacionamiento, wc, calle, lat, lng, precioId, categoriaId, usuarioId, imagen: ''
        })
        res.redirect(`/propiedades/agregar-imagen/${propiedadGuardada.id}`)
    } catch (error) {
        console.log(error)
    }
}

const agregarImagen = async (req, res) => {
    const { id } = req.params
    const propiedad = await Propiedad.findByPk(id)
    if(!propiedad || propiedad.publicado || req.usuario.id.toString() !== propiedad.usuarioId.toString()) {
        return res.redirect('/mis-propiedades')
    }
    res.render('propiedades/agregar-imagen', {
        pagina: `Agregar Imagen: ${propiedad.titulo}`,
        csrfToken: req.csrfToken(),
        propiedad
    })
}

const almacenarImagen = async (req, res) => {
    const { id } = req.params
    const propiedad = await Propiedad.findByPk(id)
    if(!propiedad || propiedad.publicado || req.usuario.id.toString() !== propiedad.usuarioId.toString()) {
        return res.redirect('/mis-propiedades')
    }

    try {
        if(!req.file) return res.status(400).json({ mensaje: 'No se recibió ninguna imagen' })
        propiedad.imagen = req.file.filename
        propiedad.publicado = 1
        await propiedad.save()
        return res.status(200).json({ mensaje: 'Imagen cargada correctamente' })
    } catch (error) {
        return res.status(500).json({ mensaje: 'Error al almacenar la imagen' })
    }
}

const editar = async (req, res) => {
    const { id } = req.params
    const propiedad = await Propiedad.findByPk(id)
    if(!propiedad || propiedad.usuarioId.toString() !== req.usuario.id.toString()) {
        return res.redirect('/mis-propiedades')
    }
    const [categorias, precios] = await Promise.all([
        Categoria.findAll(),
        Precio.findAll()
    ])
    res.render('propiedades/editar', {
        pagina: `Editar Propiedad: ${propiedad.titulo}`,
        csrfToken: req.csrfToken(),
        categorias, precios, datos: propiedad
    })
}

const guardarCambios = async (req, res ) => {
    let resultado = validationResult(req)
    if(!resultado.isEmpty()) {
        const [categorias, precios] = await Promise.all([
            Categoria.findAll(),
            Precio.findAll()
        ])
        return res.render('propiedades/editar', {
            pagina: 'Editar Propiedad',
            csrfToken: req.csrfToken(),
            categorias, precios, errores: resultado.array(), datos: req.body
        })
    }

    const { id } = req.params
    const propiedad = await Propiedad.findByPk(id)
    if(!propiedad || propiedad.usuarioId.toString() !== req.usuario.id.toString()) {
        return res.redirect('/mis-propiedades')
    }

    try {
        const { titulo, descripcion, habitaciones, estacionamiento, wc, calle, lat, lng, precio: precioId, categoria: categoriaId } = req.body
        propiedad.set({ titulo, descripcion, habitaciones, estacionamiento, wc, calle, lat, lng, precioId, categoriaId })
        await propiedad.save();
        res.redirect('/mis-propiedades')
    } catch (error) {
        console.log(error)
    }
}

const eliminar = async (req, res) => {
    const { id } = req.params
    const propiedad = await Propiedad.findByPk(id)
    if (!propiedad || propiedad.usuarioId.toString() !== req.usuario.id.toString()) {
        return res.redirect('/mis-propiedades')
    }

    if (propiedad.imagen) {
        const rutaImagen = path.join(process.cwd(), 'public', 'uploads', propiedad.imagen)
        try { await unlink(rutaImagen) } catch (error) { console.log(error.message) }
    }

    await propiedad.destroy()
    res.redirect('/mis-propiedades')
}

const cambiarEstado = async (req, res) => {
    const { id } = req.params
    const propiedad = await Propiedad.findByPk(id)
    if(!propiedad || propiedad.usuarioId.toString() !== req.usuario.id.toString()) {
        return res.redirect('/mis-propiedades')
    }
    propiedad.publicado = !propiedad.publicado
    await propiedad.save()
    res.json({ resultado: true })
}

const mostrarPropiedad = async (req, res) => {
    const { id } = req.params
    const propiedad = await Propiedad.findByPk(id, {
        include : [
            { model: Precio, as: 'precio' },
            { model: Categoria, as: 'categoria' },
        ]
    })
//no me acuerdo para que era para validar la oferta 
    if(!propiedad) return res.redirect('/404')

        let yaEnvioOferta = false
    if (req.usuario) {
        const mensajePrevio = await Mensaje.findOne({
            where: {
                propiedadId: id,
                usuarioId: req.usuario.id
            }
        })
        yaEnvioOferta = !!mensajePrevio
    }

    res.render('propiedades/mostrar', {
        propiedad,
        pagina: propiedad.titulo,
        csrfToken: req.csrfToken(),
        usuario: req.usuario,
        esVendedor: esVendedor(req.usuario?.id, propiedad.usuarioId ),
        enviado: req.query.enviado,
        yaEnvioOferta // Pasamos esto a Pug
    })
}

const enviarMensaje = async (req, res) => {
    const { id } = req.params
    const propiedad = await Propiedad.findByPk(id, {
        include : [
            { model: Precio, as: 'precio' },
            { model: Categoria, as: 'categoria' },
        ]
    })
    if(!propiedad) return res.redirect('/404')

    const mensajePrevio = await Mensaje.findOne({
        where: {
            propiedadId: id,
            usuarioId: req.usuario.id
        }
    })

    if(mensajePrevio) {
        return res.render('propiedades/mostrar', {
            propiedad,
            pagina: propiedad.titulo,
            csrfToken: req.csrfToken(),
            usuario: req.usuario,
            esVendedor: esVendedor(req.usuario?.id, propiedad.usuarioId ),
            errores: [{ msg: 'Ya has enviado una oferta para esta propiedad' }],
            yaEnvioOferta: true
        })
    }

    let resultado = validationResult(req)
    if(!resultado.isEmpty()) {
        return res.render('propiedades/mostrar', {
            propiedad,
            pagina: propiedad.titulo,
            csrfToken: req.csrfToken(),
            usuario: req.usuario,
            esVendedor: esVendedor(req.usuario?.id, propiedad.usuarioId ),
            errores: resultado.array(),
            yaEnvioOferta: false
        })
    }

    const { mensaje, oferta } = req.body
    await Mensaje.create({
        mensaje,
        oferta: oferta || null,
        propiedadId: id,
        usuarioId: req.usuario.id
    })
    res.redirect(`/propiedad/${id}?enviado=true`)
}

const verMensajes = async (req, res) => {
    const { id } = req.params
    const propiedad = await Propiedad.findByPk(id, {
        include: [
            { model: Mensaje, as: 'mensajes', 
                include: [{model: Usuario.scope('eliminarPassword'), as: 'usuario'}]
            },
        ],
    })
    if(!propiedad || propiedad.usuarioId.toString() !== req.usuario.id.toString()) {
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

    try {
        const mensaje = await Mensaje.findByPk(id, { 
            include: [{ model: Propiedad, as: 'propiedade' }] 
        })
        
        if(!mensaje || mensaje.propiedade.usuarioId.toString() !== req.usuario.id.toString()) {
            return res.redirect('/mis-propiedades')
        }

        const propiedad = await Propiedad.findByPk(mensaje.propiedadId)
        propiedad.publicado = false
        await propiedad.save()
        
        await mensaje.destroy()
        res.redirect('/mis-propiedades')
    } catch (error) {
        console.log(error)
        res.redirect('/mis-propiedades')
    }
}

const rechazarOferta = async (req, res) => {
    const { id } = req.params

    try {
        const mensaje = await Mensaje.findByPk(id, { 
            include: [{ model: Propiedad, as: 'propiedade' }] 
        })
        
        if(!mensaje || mensaje.propiedade.usuarioId.toString() !== req.usuario.id.toString()) {
            return res.redirect('/mis-propiedades')
        }

        const propiedadId = mensaje.propiedadId
        await mensaje.destroy()
        res.redirect(`/mensajes/${propiedadId}`)
    } catch (error) {
        console.log(error)
        res.redirect('/mis-propiedades')
    }
}

export {
    admin,
    crear,
    guardar, 
    agregarImagen, 
    almacenarImagen, 
    editar, 
    guardarCambios,
    eliminar, 
    cambiarEstado, 
    mostrarPropiedad, 
    enviarMensaje, 
    verMensajes,
    aceptarOferta, 
    rechazarOferta
}