const { format } = require('date-fns');

const formattedDate = (date) => {
    return format(new Date(date), 'yyyy-MM-dd HH:mm:ss')
};

module.exports = {
    formattedDate
}