const crypto = require('crypto');
const bcrypt = require('bcrypt');

const generateTempPassword = (len = 12) => {
  const tempPassword = crypto.randomBytes(len).toString('base64').slice(0, len);
  return tempPassword;
};

const encryptPassword = (password) => {
    const salt = bcrypt.genSaltSync(10);
    return bcrypt.hashSync(password, salt);
};

module.exports = {
    generateTempPassword,
    encryptPassword
}