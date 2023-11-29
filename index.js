const express = require('express');
const session = require('express-session');
const { Chart } = require('chart.js');
const fs = require('fs');
const path = require('path'); 
const app = express();
const port = 8080;

app.use(express.urlencoded({ extended: false }));
app.use(express.static(__dirname));

// Configuração da sessão
app.use(session({
    secret: 'suaChaveSecreta',
    resave: false,
    saveUninitialized: true
}));

// Rota principal - exibe o formulário de login
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/login.html');
});

// Rota para processar o formulário de login
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    // Exemplo simples: se o nome de usuário é "admin" e a senha é "password"
    if (username === 'admin' && password === 'password') {
        // Defina a variável de sessão para indicar que o usuário está autenticado
        req.session.authenticated = true;

        // Redirecione para a página de dashboard
        res.redirect('/dashboard');
    } else {
        res.send('Login falhou. Verifique suas credenciais.');
    }
});

// Rota para a página de dashboard
app.get('/dashboard', (req, res) => {
    if (req.session.authenticated) {

        // Lê o conteúdo do arquivo dashboard.html
        const dashboardContent = fs.readFileSync(path.join(__dirname, 'dashboard.html'), 'utf8');

        // Envia o conteúdo do arquivo como resposta
        res.send(dashboardContent.replace('META DO MÊS', `META DO MÊS`));
    } else {
        res.redirect('/');
    }
});

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
