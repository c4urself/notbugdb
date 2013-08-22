var app = require('./app/setup')();
app.listen(app.get('port'), function () {
    console.log('Listening on: ', app.get('port'));
});
