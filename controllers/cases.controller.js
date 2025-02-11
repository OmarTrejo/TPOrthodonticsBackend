const pool = require('../database/config');
const getALLcases = async (req , res , next) => {
    const {idUser} = req.params;
    const user_id = req.user.id;
console.log (idUser)
console.log (req.query)
    try {
        const [rows] = await pool.query('select * from cases');

        if (rows.length === 0) {
            return res.status(404).json({ status: false, message: "Cases not found", data:[] });
        }

        res.status(201).json({status: true, message: 'Successfully', data: rows });
    } catch (error) {
        next(error)
    }
}  ;

const addcases = async (req ,  res , next)=> {
const{id, namePa, ApePac, cliente, archivo, obsertec, obser, coment,numeroOrd,url, status } = req.body;
try {
    const [result] = await pool.query('INSERT INTO cases (type_case_id, patient_first_name, patient_last_name, customer_id,    attachment_form, tech_observations, observations, general_comments, order_number, url_viewer, status_case_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?', [id, namePa, ApePac, cliente, archivo, obsertec, obser, coment,numeroOrd,url, status])
    

    if (result.affectedRows === 0) {
        return res.status(500).json({ status: false, message: 'Error to create Cases. Please try again later.', data:[] });
    }

    // Save a logs
   

    res.status(201).json({status: true, message: 'Cases registered successfully', data: result.insertId });
    
} catch (error) {
    next(error)
}

}


module.exports={getALLcases, addcases}
