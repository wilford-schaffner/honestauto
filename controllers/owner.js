const showOwnerDashboard = (req, res) => {
    res.render('dashboard/owner/index', {
        title: 'Owner dashboard – Honest Auto'
    });
};

const showOwnerVehicles = (req, res) => {
    res.render('dashboard/owner/vehicles', {
        title: 'Inventory – Honest Auto',
        vehicles: []
    });
};

const showOwnerCategories = (req, res) => {
    res.render('dashboard/owner/categories', {
        title: 'Categories – Honest Auto',
        categories: []
    });
};

const showOwnerUsers = (req, res) => {
    res.render('dashboard/owner/users', {
        title: 'Users – Honest Auto',
        users: []
    });
};

const showOwnerContactSubmissions = (req, res) => {
    res.render('dashboard/owner/contact-submissions', {
        title: 'Contact submissions – Honest Auto',
        messages: []
    });
};

export {
    showOwnerDashboard,
    showOwnerVehicles,
    showOwnerCategories,
    showOwnerUsers,
    showOwnerContactSubmissions
};

