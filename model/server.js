const express = require('express');
const cors = require('cors');
const errorHandler = require('../middleware/errorHandler');
const authenticateUser = require('../middleware/auth');

class Server {

    constructor() {
        this.app = express();
        this.port = process.env.PORT;
        this.authPath = '/api/public/auth';
        this.usersPath = '/api/users';
        this.organizationPath = '/api/organization';
        this.catalogsPath = '/api/catalogs';
        this.accessRequestsPath = '/api/access';
        this.recycleBinPath = '/api/recyclebin';
        this.permissionPath = '/api/permissions';

        //Middlewares
        this.middlewares();

        //Rutas de mi aplicación
        this.routes();
    }

    middlewares () {
        
        // CORS
        this.app.use( cors({ origin: '*'}) );

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
        this.app.use(this.catalogsPath, authenticateUser, require('../routes/catalogs'));
        this.app.use(this.accessRequestsPath, authenticateUser, require('../routes/access'));
        this.app.use(this.recycleBinPath, authenticateUser, require('../routes/recyclebin'));
        this.app.use(this.permissionPath, authenticateUser, require('../routes/permissions'));
    }

    listen(){     
          // Manejo de erorres
          this.app.use(errorHandler);

        this.app.listen(this.port, () => {
            console.log(`Servidor corriendo ${process.env.BASE_URL} puerto`, this.port);
        });
    }

}

module.exports = Server;