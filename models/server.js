const express = require('express');
const cors = require('cors');
const errorHandler = require('./errorHandler');
const authenticate = require('./auth');

class Server {

    constructor() {
        this.app = express();
        this.port = process.env.PORT;
        this.usersPath = '/api/users';

        //Middlewares
        this.middlewares();

        //Rutas de mi aplicación
        this.routes();
    }

    middlewares () {
        
        // CORS
        this.app.use( cors() );

        // Lectura y parseo del body
        this.app.use( express.json() );

        // Directorio Público
        this.app.use( express.static('public') );

        // JWT auth
        // this.app.use(authenticate)

        // Manejo de erorres
        this.app.use(errorHandler);
    }

    routes () {
        this.app.use(this.usersPath, require('../routes/users'));
    }

    listen(){     
        this.app.listen(this.port, () => {
            console.log('Servidor corriendo en puerto', this.port);
        });
    }

}

module.exports = Server;