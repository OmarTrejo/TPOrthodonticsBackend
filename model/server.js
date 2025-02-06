const express = require('express');
const cors = require('cors');
const errorHandler = require('../middleware/errorHandler');
const authenticateUser = require('../middleware/auth');

class Server {

    constructor() {
        this.app = express();
        this.port = process.env.PORT;
        this.publicPath = '/public';
        this.authPath = '/api/auth';
        this.usersPath = '/api/users';
        this.organizationPath = '/api/organization';
        this.countriesPath = '/api/countries';

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
        // this.app.use(authenticateUser); // Esto no, lo aplica a todas
    }

    routes () {
        // Public routes
        this.app.use(this.authPath, require('../routes/auth'));

        // Private routes (required JWT)
        this.app.use(this.usersPath, authenticateUser, require('../routes/users'));
        this.app.use(this.organizationPath, authenticateUser, require('../routes/organization'));
        this.app.use(this.countriesPath, authenticateUser, require('../routes/countries'));
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