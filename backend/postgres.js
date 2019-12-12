const Pool = require('pg').Pool;
const pool = new Pool({
  user: 'postgres',
  //host: 'localhost',
  host: '10.30.124.86',
  database: 'file-upload',
  password: 'admin',
  port: 5432
})

module.exports.pool = pool;