const util = require('util');
const MySQL = require('mysql');

const config = require('./../config');
const { Log } = require('./utils/logger');

var pool = MySQL.createPool({
    connectionLimit: 10,
    host: config.DB_HOST,
    user: config.DB_USER,
    password: config.DB_PASS,
    database: config.DB_NAME
});
/*
pool.getConnection((err, connection) => {
    if (err) {
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            Log("Database connection was closed.");
        }
        if (err.code === 'ER_CON_COUNT_ERROR') {
            Log('Database has too many connections.')
        }
        if (err.code === 'ECONNREFUSED') {
            Log('Database connection was refused.')
        }
    }

    if (connection) connection.release()

    return
})*/

pool.query = util.promisify(pool.query)

module.exports = pool;