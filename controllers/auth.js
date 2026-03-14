const showLoginForm = (req, res) => {
    res.render('auth/login', {
        title: 'Log in – Honest Auto'
    });
};

const handleLogin = (req, res) => {
    res.status(501).type('text/plain').send('Login handling will be implemented in a later commit.');
};

const showRegisterForm = (req, res) => {
    res.render('auth/register', {
        title: 'Create account – Honest Auto'
    });
};

const handleRegister = (req, res) => {
    res.status(501).type('text/plain').send('Registration handling will be implemented in a later commit.');
};

const handleLogout = (req, res) => {
    res.redirect('/');
};

export { showLoginForm, handleLogin, showRegisterForm, handleRegister, handleLogout };

