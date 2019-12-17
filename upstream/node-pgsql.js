const Pool = require('pg').Pool;

var pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'file-upload',
    password: 'admin',
    port: 5432

})

module.exports.pool = pool;