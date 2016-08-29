var bookshelf = require('../db');

var User = bookshelf.Model.extend({
   tableName: 'users',
   idAttribute: 'id',
});

module.exports = {
   User: User
};