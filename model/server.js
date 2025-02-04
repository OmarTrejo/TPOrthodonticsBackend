const express = require('express');
const cors = require('cors');
const errorHandler = require('../middleware/errorHandler');

class Server {

    constructor() {
        this.app = express();
        this.port = process.env.PORT;
        this.authPath = '/api/auth';
        this.usersPath = '/api/users';
        this.organizationPath = '/api/organization';

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
    }

    routes () {
        this.app.use(this.authPath, require('../routes/auth'));
        this.app.use(this.usersPath, require('../routes/users'));
        this.app.use(this.organizationPath, require('../routes/organization'));
    }

    listen(){     
          // Manejo de erorres
          this.app.use(errorHandler);

        this.app.listen(this.port, () => {
            console.log('Servidor corriendo en puerto', this.port);
        });
    }

}

module.exports = Server;