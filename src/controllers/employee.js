const showEmployeeDashboard = (req, res) => {
    res.render('dashboard/employee/index', {
        title: 'Employee dashboard – Honest Auto'
    });
};

const showEmployeeVehicles = (req, res) => {
    res.render('dashboard/employee/vehicles', {
        title: 'Inventory – Honest Auto',
        vehicles: []
    });
};

const showEmployeeReviews = (req, res) => {
    res.render('dashboard/employee/reviews', {
        title: 'Reviews – Honest Auto',
        reviews: []
    });
};

const showEmployeeServiceRequests = (req, res) => {
    res.render('dashboard/employee/service-requests', {
        title: 'Service requests – Honest Auto',
        requests: []
    });
};

const showEmployeeServiceRequestDetail = (req, res) => {
    res.render('dashboard/employee/service-request-detail', {
        title: 'Service request – Honest Auto',
        request: null
    });
};

const showEmployeeContactSubmissions = (req, res) => {
    res.render('dashboard/employee/contact-submissions', {
        title: 'Contact submissions – Honest Auto',
        messages: []
    });
};

export {
    showEmployeeDashboard,
    showEmployeeVehicles,
    showEmployeeReviews,
    showEmployeeServiceRequests,
    showEmployeeServiceRequestDetail,
    showEmployeeContactSubmissions
};

