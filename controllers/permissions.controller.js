const pool = require("../database/config");

/** 
 * TODO Get permission by role, modules and actions 
 */
const getAllPermissions = async (req, res, next) => {
    try {
        // Consultar el role del usuario
        const [roles] = await pool.query('SELECT id, role_name, status FROM role_user');

        // Formatear los resultados
        const filteredResponse = await Promise.all(roles.map(async (role) => {

            // Consultar los modulos del role
            const [acls] = await pool.query('SELECT * FROM vw_access_control_list WHERE role_id = ?', [role.id]);

            // Construir la estructura de módulos y acciones
            const modulesMap = new Map();

            // Generación de map
            for (const acl of acls) {
                if (!modulesMap.has(acl.module_id)) {
                    modulesMap.set(acl.module_id, {
                        id: acl.module_id,
                        name: acl.module,
                        status: Boolean(acl.is_enabled),
                        actions: []
                    });
                }

                const module = modulesMap.get(acl.module_id);

                module.actions.push({
                    id: acl.action_id,
                    name: acl.action_name,
                    enabled: Boolean(acl.is_enabled) // Asumimos que todas las acciones están habilitadas
                });
            }

            const modules = Array.from(modulesMap.values());

            return {
                id: role.id,
                name: role.role_name,
                modules
            };
        })
        );

        res.status(200).json(filteredResponse);
    } catch (error) {
        next(error);
    }
}

const updateManyPermissions = async (req, res, next) => {
    try {
        const permissions = req.body;

        for (const permission of permissions) {
            const { id, modules } = permission;
            const role_id = id;
            for (const module of modules) {
                const { actions } = module;
                for (const action of actions) {
                    const { id, enabled } = action;
                    const aclId = id;
                    // Actualizar la tabla de permisos
                    await pool.query('UPDATE acl SET is_enabled = ? WHERE id = ?', [enabled, aclId]);
                }
            }
        }

        res.status(200).json(permissions);
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getAllPermissions,
    updateManyPermissions
};