const pool = require('../../database/config');

const User = {
    async findById () {
        const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [this.id]);
        return rows[0];
    },
    async save (userData) {
        const [result] = await pool.query('INSERT INTO users SET ?', [userData]);
        return result.insertId;
    },
    async getAll () {
        const [rows] = await pool.query('SELECT * FROM users');
        return rows;
    },
    async update (userData) {
        await pool.query('UPDATE users SET ? WHERE id = ?', [userData, this.id]);
    },
    async delete () {
        await pool.query('DELETE FROM users WHERE id = ?', [this.id]);
    }
}

module.exports = User;