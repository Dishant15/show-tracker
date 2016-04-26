var express = require('express');
var router = express.Router();

var db = require('../db');

/* GET home page. */
router.get('/', function(req, res) {
	db.find({}, function(err, data){
		res.render('index', { 
			title: 'Home | ShowTracker',
			show_list : data
		});
	});
});

router.get('/add', function(req, res) {
  res.render('add_show', { title: 'Express' });
});

router.post('/add', function(req, res){
	db.insert(req.body, function(err, newShow){
		if(err) throw err;
		res.redirect('/');
	});
});

module.exports = router;
