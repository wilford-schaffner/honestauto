const showUserDashboard = (req, res) => {
    res.render('user/index', {
        title: 'Your account – Honest Auto'
    });
};

const listServiceRequests = (req, res) => {
    res.render('user/service-requests', {
        title: 'Your service requests – Honest Auto',
        requests: []
    });
};

const showNewServiceRequestForm = (req, res) => {
    res.render('user/service-request-new', {
        title: 'New service request – Honest Auto'
    });
};

const showServiceRequestDetail = (req, res) => {
    res.render('user/service-request-detail', {
        title: 'Service request – Honest Auto',
        request: null
    });
};

export {
    showUserDashboard,
    listServiceRequests,
    showNewServiceRequestForm,
    showServiceRequestDetail
};

