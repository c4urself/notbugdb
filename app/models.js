
function Bug() {}

Bug.prototype = {
    id: '',
    abstract: '',
    date: '',
    severity: '',
    product: '',
    status: ''
};

var severities = {
    1: 'Urgent',
    2: 'High',
    3: 'Medium',
    4: 'Low'
};

var statuses = {
    10: 'Open Desc. Phase',
    11: 'Open',
};


module.exports = {
    Bug: Bug,
    getSeverity: function (key) {
        return severities[key] || key;
    },
    getStatus: function (key) {
        return statuses[key] || key;
    }
}
