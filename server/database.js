const util = require('util');
const MySQL = require('mysql');

const config = require('./../config');
const { Log } = require('./utils/logger');

var pool = MySQL.createPool({
    connectionLimit: 10,
    host: config.DB_HOST,
    port: config.DB_PORT,
    user: config.DB_USER,
    password: config.DB_PASS,
    database: config.DB_NAME
});

function GetConnection(callback) {
    pool.getConnection((error, con) => {
        callback(error, con);
    });
}

function QueryNow(query, params=[]) {
    return new Promise(function(resolve, reject) {
        GetConnection((error, con) => {
            if(error) reject({ type: 0, error: error });
            con.query(query, params, function (err, rows, fields) {
                con.release();
                
                if (err) return reject({ type: 1, error: err });
                resolve(rows);
            })
        });
    });
}

function GetPageLimit(currentPage, itemCount, itemPerPage) {
    var item_count = itemCount;
	var page_count = 1, page_current = 1, item_start = 0;

	// Convert them to pages
    if(item_count > 0) page_count = Math.ceil(item_count / itemPerPage);
    if(!currentPage) currentPage = 1;

    page_current = currentPage;

    if(page_current <= 0) page_current = 1;
    else if(page_current > page_count) page_current = page_count;

    if(item_count > 0) item_start = (page_current * itemPerPage) - itemPerPage;

    return {
        START: item_start,
        LIMIT: itemPerPage
    };
}
/*
function CheckConnection() {
    return pool.getConnection((err, connection) => {
        if (err) {
            if (err.code === 'PROTOCOL_CONNECTION_LOST')
                Log("Database connection was closed.");
            if (err.code === 'ER_CON_COUNT_ERROR')
                Log('Database has too many connections.');
            if (err.code === 'ECONNREFUSED')
                Log('Database connection was refused.');

            return false;
        }

        if (connection)
            connection.release()

        return true;
    })
}*/

pool.query = util.promisify(pool.query)

module.exports = {
    pool,
    MySQL,
    GetConnection,
    QueryNow,
    GetPageLimit
};