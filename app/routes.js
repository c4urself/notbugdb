var request = require('request');
var cheerio = require('cheerio');
var jar = request.jar();
var request = request.defaults({jar: jar});
var models = require('./models');

var password = 'cukNlibi5auk4NJCa22754RCAVS4t9';

var urls = {
    list: 'https://bug.oraclecorp.com/pls/bug/webbug_reports.my_open_bugs',
    login: 'https://login.oracle.com/mysso/signon.jsp',
    auth: 'https://login.oracle.com/oam/server/sso/auth_cred_submit',
    item: 'https://bug.oraclecorp.com/pls/bug/webbug_edit.edit_info_by_rptno?rptno='
};


var doOracleLogin = function (postData, cb) {
    request.get(urls.list, function (err, res, body) {
        var $ = cheerio.load(body);

        postData.locale = '';
        postData.v = '1.4';
        postData.site2pstoretoken = $('input[name=site2pstoretoken]').val();
        postData.request_id = $('input[name=request_id]').val();
        postData.OAM_REQ = $('input[name=OAM_REQ]').val();

        request.post(urls.auth, function (err, response, body) {
            if (jar.get('OAM_ID')) {
                cb();
            }
            cb('Not authenticated correctly.');
        }).form(postData);

        // note that post gets sent on nextTick
    });
};

module.exports = function (app) {

    app.get('/login', function (req, res, next) {
        res.render('login.jade', {title: 'Oracle SSO'});
    });

    app.post('/login', function (req, res, next) {
        doOracleLogin({
            ssousername: req.body.username,
            password: req.body.password,
        }, function (err) {
            if (err) {
                res.render('login.jade', {error: true}, function (err, html) {
                    res.send(401, html);
                });
            } else {
                res.redirect('ticket/');
            }
        });
    });

    app.get('/ticket', function (req, res, next) {
        console.log('session');
        console.log(req.session);
        var bugs = [];
        request.get(urls.list, function (err, response, body) {

            console.log('jar');
            console.log(jar);

            if (err) return console.error(err);

            var $ = cheerio.load(body);

            $('tbody#data tr').map(function (i, tr) {
                if (i === 0) return;
                var bug = new models.Bug();
                bug.id = $('td:nth-child(3) a', this).text();
                bug.date = $('td:nth-child(5)', this).text();
                bug.severity = $('td:nth-child(6)', this).text();
                bug.status = $('td:nth-child(7)', this).text();
                bug.product = $('td:nth-child(8)', this).text();
                bug.abstract = $('td:nth-child(11)', this).text();
                bugs.push(bug);
            });
            res.render('list.jade', {bugs: bugs});
        });
    });

    app.get('/ticket/:id', function (req, res, next) {
        var x = request.get(urls.item + req.params.id, function (err, response, body) {
            if (err) return console.error(err);
            var $ = cheerio.load(body);
        });
        req.pipe(x).pipe(res);
    });
};
