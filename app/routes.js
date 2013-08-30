var request = require('request');
var cheerio = require('cheerio');
var jar = request.jar();
var request = request.defaults({jar: jar});
var models = require('./models');


var urls = {
    list: 'https://bug.oraclecorp.com/pls/bug/webbug_reports.my_open_bugs',
    login: 'https://login.oracle.com/mysso/signon.jsp',
    auth: 'https://login.oracle.com/oam/server/sso/auth_cred_submit',
    item: 'https://bug.oraclecorp.com/pls/bug/webbug_edit.edit_info_by_rptno?rptno='
};

var isAuthenticated = function () {
    return !!getCookie('ORA_UCM_INFO');
};

var getCookie = function (cookieName) {
    for (var i = 0; i < jar.cookies.length; i++) {
        var item = jar.cookies[i];
        if (item.name === cookieName) {
            return item;
        }
    }
};

var doOracleLogin = function (req, postData, cb) {
    request.get(urls.list, function (err, res, body) {
        var $ = cheerio.load(body);

        postData.locale = '';
        postData.v = '1.4';
        postData.site2pstoretoken = $('input[name=site2pstoretoken]').val();
        postData.request_id = $('input[name=request_id]').val();
        postData.OAM_REQ = $('input[name=OAM_REQ]').val();

        request.post(urls.auth, function (err, response, body) {
            if (isAuthenticated()) {
                req.session.user = postData.ssousername;
                cb();
            } else {
                cb('Not authenticated correctly.');
            }
        }).form(postData);

        // note that post gets sent on nextTick
    });
};

module.exports = function (app) {

    app.get('/', function (req, res, next) {
        if (isAuthenticated()) {
            res.redirect('/ticket');
        } else {
            res.redirect('/login');
        }
    });

    app.get('/login', function (req, res, next) {
        if (isAuthenticated()) {
            res.redirect('/ticket');
        } else {
            res.render('login.jade', {title: 'Oracle SSO'});
        }
    });

    app.post('/login', function (req, res, next) {
        doOracleLogin(req, {
            ssousername: req.body.username,
            password: req.body.password,
        }, function (err) {
            if (err) {
                res.render('login.jade', {error: true}, function (err, html) {
                    res.send(401, html);
                });
            } else {
                res.redirect('/ticket');
            }
        });
    });

    app.get('/ticket', function (req, res, next) {
        if (!isAuthenticated()) {
            res.redirect('/login');
        }
        var bugs = [];
        request.get(urls.list, function (err, response, body) {

            if (err) return console.error(err);

            var $ = cheerio.load(body);

            $('tbody#data tr').map(function (i, tr) {
                if (i === 0) return;
                var bug = new models.Bug();
                bug.id = $('td:nth-child(3) a', this).text();
                bug.date = $('td:nth-child(5)', this).text();
                bug.reporter = $('td:nth-child(6)', this).text();
                bug.severity = $('td:nth-child(7)', this).text();
                bug.status = $('td:nth-child(8)', this).text();
                bug.product = $('td:nth-child(9)', this).text();
                bug.component = $('td:nth-child(10)', this).text();
                bug.version = $('td:nth-child(11)', this).text();
                bug.summary = $('td:nth-child(12)', this).text();
                bug.prettySeverity = models.getSeverity(bug.severity);
                bug.prettyStatus = models.getStatus(bug.status);

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
