var express = require('express');

module.exports = function () {
    var app = express();
    app.set('port', process.env.PORT || 3000);
    app.set('views', __dirname + '/../templates');
    app.set('view engine', 'jade');
    app.locals.pretty = true;

    console.log(app.get('views'));
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.bodyParser());     // handle forms
    app.use(express.methodOverride()); // allows for app.put and app.delete
    app.use(express.cookieParser('nimbula'));
    app.use(express.session());
    app.use(app.router);               // sets the point routes are handled
    app.use(require('less-middleware')({ src: __dirname + '/../public' }));
    app.use(express.static('public'));

    require('./routes')(app);

    return app;
};
