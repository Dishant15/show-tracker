var express = require('express');
var router = express.Router();
var request = require('request');
var cheerio = require('cheerio');
var async = require('async');

var db = require('../db');


// function to scrap data from given url
function get_data(url, callback) {
	var result = {};
	request(url, function (err, responce, html) {
		var $ = cheerio.load(html);
		if($("#previous_episode").length == 0){
			// this dom not available
			callback(null);
			return;
		}
		$("#previous_episode").filter(function() {
			// get current episode data
			try {
				var parse_list = $(this).text().replace(/ /g,"+").replace(/\s/g, "").split(":");
			
				result.ep_name = parse_list[1].replace(/[+]/g," ").replace('Date','');
				result.series_no = parse_list[3].replace(/[+]/g," ").replace('Episode','');
				result.ep_no = parse_list[4].replace(/[+]/g," ").replace('Summary','');
			} catch(err) {
				console.log(err);
				callback(null);
				return;
			}
			$("#next_episode").filter(function(){
				// get next episode data
				try {
					var parse_list = $(this).text().replace(/ /g,"+").replace(/\s/g, "").split(":");

					result.next_ep_name = parse_list[1].replace(/[+]/g," ").replace('Countdown','');
					result.countdown = parse_list[2].replace(/[+]/g," ").replace('Date','');
					callback(result);
				} catch(err) {
					result.next_ep_name = null;
					result.countdown = null;
					callback(result);
				}				
			});
		});
	});
};



/* GET home page. */
router.get('/', function(req, res) {
	db.find({}, function(err, data){
		var main_list = [];
		async.each(data,
			function(show, callback){
			// hit show url and get its data
				get_data(show.fetch_url, function(latest_data){
					if(latest_data == null){
						// can not get this data
						show.up_to_date = true;
					}
					else if(show.current == latest_data.series_no + '.' + latest_data.ep_no + ' ' + latest_data.ep_name){
						show.up_to_date = true;
						show.data = latest_data;
						db.update({_id:show._id}, show, {});
					} else {
						show.up_to_date = false;
						show.data = latest_data;
						db.update({_id:show._id}, show, {});
					}
					main_list.push(show);
					callback();
				});
			},
			function(){
				res.render('index', { 
					title: 'Home | ShowTracker',
					show_list : main_list,
				});
			}
		);
	});
});

router.get('/add', function(req, res) {
  res.render('add_show', { 
  	title: 'Add show | ShowTracker',
  });
});

router.post('/add', function(req, res){
	var newShow = req.body;
	get_data(newShow.fetch_url, function(new_data){
		if(new_data == null){
			res.render('error', {
				message : "Could not fetch details of this show",
				error : {status : "Show may have ended/canceled or there maybe an error at our side!!", stack : null}
			});
			return;
		}
		newShow.data = new_data;
		newShow.up_to_date = false;
		newShow.current = "You just started watching this!!";
		db.insert(newShow, function(err, s){
			if(err) throw err;
			res.redirect('/');
		});
	});
});

router.get('/update/:id', function(req, res){
	var id = req.params.id;
	db.findOne({_id:id}, function(err, show){
		if(err) throw err;
		get_data(show.fetch_url, function(new_data){
			show.data = new_data;
			show.up_to_date = true;
			show.current = new_data.series_no + '.' + new_data.ep_no + ' ' + new_data.ep_name;
			db.update({_id : id}, show, {}, function(err, numAffected, affectedDocuments, upsert){		
				if(err) throw err;
				res.json({current:show.current});
			});
		});
	});
});

router.get('/edit/:id', function(req, res){
	db.findOne({_id:req.params.id}, function(err, show){
		if(err) throw err;
		res.render('edit_show', { 
		  	title: 'Edit show | ShowTracker',
		  	show:show
		});
	})
});

router.post('/edit/:id', function(req, res){
	db.update({_id:req.params.id}, {$set : req.body}, {}, function(err){
		if(err) throw err;
		res.redirect('/');
	});
});

router.get('/delete/:id', function(req, res){
	db.remove({_id:req.params.id}, {}, function(err, show){
		if(err) throw err;
		res.redirect('/');
	})
});

module.exports = router;
