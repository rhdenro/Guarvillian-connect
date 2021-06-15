var createError = require('http-errors');
var fs = require('fs');
const oracledb = require('oracledb');
var express = require('express');
var qs = require('querystring');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var app = express();
var router = express.Router();
var bodyParser = require('body-parser');
var request = require('request');
const url = require('url');
var dbConfig = require('./dbconfig.js');

var result=({
    'grade2':[],
    'grade3':[],
    'grade4':[],
    'rank':[]
});
const EventEmitter = require('events');
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(logger('dev'));
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
data = load_data;
function load_data(cb){
        oracledb.getConnection({
            user: dbConfig.user,
            password: dbConfig.password,
            connectString: dbConfig.connectString
        }, function (err, connection) {
            if (err) {
                console.error(err.message);
                return;
            } connection.execute("SELECT * FROM PRE", {}, {outFormat: oracledb.OBJECT}, function (err, result) {
                if (err) {
                    console.error(err.message);
                    doRelease(connection);
                    return;
                }
                var arrStr = JSON.stringify(result.rows);
                doRelease(connection);
                data = arrStr;
                console.log('debug')
                cb(arrStr);
            });
        });
        // DB 연결 해제
        function doRelease(connection) {
            connection.release(function (err) {
                if (err) {
                    console.log('error emerged');
                    console.error(err.message);
                }
            });
        }
}
load_data(function(arrStr){
    data = arrStr;
})
var hazard_level = 4;
var location = '';
var disease = '';
var grade_2=({
    '눈':'안과',
    '코':'코질환',
    '귀': '귀질환',
    '호흡': '호흡기',
    '심장': '심혈관',
    '뼈': '정형외과'
});
var grade_3=([
    '오용,중독', '과다복용', '물질금단',
    '환각','우울증','자살','자해',
    '의식수준','착란','현운','두통','발작','보행장애','사지약화','뇌졸증','두부손상',
    '눈이물질','시력장애','눈통증','눈충혈','눈부심','복시','눈 부종','눈 외상',
    '코피','코이물질','기도감염','코외상',
    '이통', '귀이물질','청력상실','이명','귀손상',
    '치아','잇몸','안면외상','인후통','경부부종','경부통증','경부외상','연하장애','안면통증',
    '숨참','호흡정지','과다호흡','객혈','기침,코막힘','호흡기이물질','알레르기',
    '심정지','흉통','심계항진','고혈압','전신쇠약','실신','전신성부종','다리부기,부종','사지말단','사지홍조',
    '복통','변비','직장내 이물질','샅고랑부위','직장통증','회음부','설사','토혈','황달','복부팽만','항문외상','식도이물질','구토',
    '임신','생리문제','질내 이물질','질분비물','질통증','질출혈',
    '옆구리 통증','혈뇨','음경부종','고환통증','소변 배출장애','요로감염','생식기 외상',
    '요통','척추 손상','절단','상지통증','하지통증','상지손상','하지손상','관절부종',
    '관통상','둔상',
    '동상','유해물질','전기','화학물질','저체온증','익수',
    '물림','쏘임','열상','화상','상처','발진','국소성부종','혹','청색증',
    '열','고혈당','저혈당','빈혈'
]);
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.get('/infor',(req,res)=> {
    console.log('return information');
    let infor=[
        {
            level: hazard_level,
            position: location,
            disease: JSON.stringify(tmp)
        }
    ]
    console.log(infor);
    res.json(infor);
});

app.get('/next', function(req,res){
    res.render("index", {keyword: location});
});

app.post('/emcInfoSend',function(req,res,next){
    //data = JSON.parse(data);
    //console.log(data);
    var sen = req.body.Content;
    location = req.body.Position;
    var openApiURL = "http://aiopen.etri.re.kr:8000/WiseNLU"; //문어 분석 URL'
    var access_key = '3e184c53-50c5-484c-894d-59ed5b09f164';
    var analysisCode = 'ner';
    var text = sen;
    var requestJson = {
        'access_key': access_key,
        'argument': {
            'text': text,
            'analysis_code': analysisCode
        }
    };
    var options = {
        url: openApiURL,
        body: JSON.stringify(requestJson),
        headers: {'Content-Type':'application/json; charset=UTF-8'}
    };
    request.post(options, function (error, response, body) {
        var decoded = JSON.parse(body);
        console.log('responseCode = ' + response.statusCode);
        //console.log('responseBody = ' + body);
        //var selecteddata = {};
        var gr2 = decoded.return_object.sentence[0].morp;
        gr3 = decoded.return_object.sentence[0].word;
        var gr2_lemma = gr2.lemma;
        console.log(gr2);
        console.log(gr3);
       function classfi_3(){
            return new Promise(function(resolve, reject){
                var temp = [[],[],[],[]];
                var temp2=[[],[],[],[]];
                var multi_word;
                data = JSON.parse(data);
                for (var i = 0; i < Object.keys(gr3).length; i++) {
                    var j=0;
                    if (grade_3.includes(gr3[i].text)) {
                        for (var k = 0; k < Object.keys(data).length; k++) {
                            if (data[k].GRADE3 == gr3[i].text) {
                                temp[0].push(data[k].GRADE2);
                                temp[1].push(data[k].GRADE3);
                                temp[2].push(data[k].GRADE4);
                                temp[3].push(data[k].POINT);
                            }
                        }
                    }
                    else if(Object.keys(gr3).length-i==1)break;
                        else { multi_word=gr3[i].text+gr3[i+1].text;
                            for (var k = 0; k < Object.keys(data).length; k++) {
                                if (data[k].GRADE3.includes(multi_word)) {
                                    temp[0].push(data[k].GRADE2);
                                    temp[1].push(data[k].GRADE3);
                                    temp[2].push(data[k].GRADE4);
                                    temp[3].push(data[k].POINT);
                                    j=1
                                }
                             }
                            i=i+j;
                            }

                    }
                var cnt=0
                for (var i = 0; i < Object.keys(gr3).length; i++) {
                        for (var k = 0; k < temp[0].length; k++) {
                            if (temp[2][k] == gr3[i].text) {
                                if(temp2[1].includes(temp[1][k]))continue;
                                if(temp2[2].includes(temp[2][k]))continue;
                                temp2[0].push(temp[0][k]);
                                temp2[1].push(temp[1][k]);
                                temp2[2].push(temp[2][k]);
                                temp2[3].push(temp[3][k]);
                            }
                        }

                }
                console.log(temp);
                for (var i = 0; i < Object.keys(gr3).length-1; i++) {
                    var j=0;
                    var multi_word2=gr3[i].text+gr3[i+1].text;
                        for (var k = 0; k < temp[0].length; k++) {
                            if (temp[2][k] ==multi_word2) {
                                if(temp2[1].includes(temp[1][k]))continue;
                                if(temp2[2].includes(temp[2][k]))continue;
                                temp2[0].push(temp[0][k]);
                                temp2[1].push(temp[1][k]);
                                temp2[2].push(temp[2][k]);
                                temp2[3].push(temp[3][k]*1);
                                console.log(typeof (temp[3][k]));
                                j=1;
                            }
                        }
                    i=i+j;
                }
                console.log(typeof(temp2[3]))
                temp = temp2;
                resolve(temp);
            })
        }
        function find_smallest(object){
           return new Promise((resolve, reject) => {
               var min = 4;
               for(i=0; i< Object.keys(object).length; i++){
                    if(min > object[i]) {
                        min = object[i]
                    }
               }
               resolve(min)
           })
        }
        async function loaditems() {
            tmp = await classfi_3();
            hazard_level = await find_smallest(tmp[3]);
            console.log(hazard_level);
            //hazard_level = await find_biggest(tmp[3]);
        }
        loaditems();
       res.redirect(url.format({
           pathname:"/next",
           query:{
               data : location
           }
       }));
    });
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

var server = app.listen(3000,function(){
  console.log('App listening on port 3000');
});

module.exports = app;