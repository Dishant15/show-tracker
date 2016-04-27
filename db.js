var Datastore = require('nedb'),
    db = new Datastore({ filename: __dirname + '/data/show_data.db' });
db.loadDatabase(function (err) {
  if(err) throw err;
});

module.exports = db;