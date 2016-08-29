var config = {
   host: 'localhost',  // your host
   user: 'root', // your database user
   password: '', // your database password
   database: 'dashboard',
   charset: 'UTF8_GENERAL_CI'
};

var knex = require('knex')({
  client: 'mysql',
  connection: config
});

module.exports = require('bookshelf')(knex);