import { DataTypes } from 'sequelize'
import db from '../config/db.js'

const Mensaje = db.define('mensajes', {
    mensaje: {
        type: DataTypes.STRING(200),
        allowNull: false
    },
     oferta: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true  
    }
});

export default Mensaje;