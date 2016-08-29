var bookshelf = require('../db');

var App = bookshelf.Model.extend({
   tableName: 'process',
});

module.exports = {
   App: App
};