var express = require('express');
var router = express.Router();
var events = require('events');
var custom_event = new events();
var emitter = new(require('events')).EventEmitter();
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', {keyword: "사창사거리"});
});
module.exports = router;
