const express = require('express');
const session = require('express-session');
const { Chart } = require('chart.js');
const fs = require('fs');
const path = require('path'); 
const app = express();
const port = 8080;

app.use(express.urlencoded({ extended: false }));
app.use(express.static(__dirname));

app.use(session({
    secret: 'suaChaveSecreta',
    resave: false,
    saveUninitialized: true
}));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/login.html');
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    if (username === 'admin' && password === 'password') {
        req.session.authenticated = true;

        res.redirect('/dashboard');
    } else {
        res.send('Login falhou. Verifique suas credenciais.');
    }
});

app.get('/dashboard', (req, res) => {
    if (req.session.authenticated) {

        const dashboardContent = fs.readFileSync(path.join(__dirname, 'dashboard.html'), 'utf8');

        res.send(dashboardContent.replace('META DO MÊS', `META DO MÊS`));
    } else {
        res.redirect('/');
    }
});

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
