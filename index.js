const express = require('express');
const session = require('express-session');
const { Chart } = require('chart.js');
const fs = require('fs');
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

// Função para gerar dados de consumo simulados
function gerarDadosSimulados(dia) {
    const consumoDiario = Array.from({ length: 24 }, () => Math.floor(Math.random() * 30) + 10); // Valores aleatórios entre 10 e 40 kWh
    const consumoSemanal = Array.from({ length: 7 }, () => Math.floor(Math.random() * 80) + 70); // Valores aleatórios entre 70 e 150 kWh

    return {
        totalKwh: consumoDiario.reduce((acc, value) => acc + value, 0),
        totalReais: 0.7 * consumoDiario.reduce((acc, value) => acc + value, 0),
        consumoDiario,
        consumoSemanal
    };
}

// Função para gerar gráficos
function gerarGraficos(dadosDiario, dadosSemanal) {
    const labelsDiario = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    const labelsSemanal = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

    const dadosGraficoDiario = {
        labels: labelsDiario,
        datasets: [{
            label: 'Consumo Diário (kWh)',
            data: dadosDiario,
            fill: false,
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 2
        }]
    };

    const dadosGraficoSemanal = {
        labels: labelsSemanal,
        datasets: [{
            label: 'Consumo Semanal (kWh)',
            data: dadosSemanal,
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 2
        }]
    };

    return { dadosGraficoDiario, dadosGraficoSemanal };
}

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
        const dadosSimulados = gerarDadosSimulados(new Date().getDay());
        const { dadosGraficoDiario, dadosGraficoSemanal } = gerarGraficos(dadosSimulados.consumoDiario, dadosSimulados.consumoSemanal);

        // Renderizar a página com os dados
        res.send(`
        <html>

        <head>
            <title>Dashboard</title>
            <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        
            <style>
                body {
                    background: linear-gradient(to bottom, #40464d, #161d2f);
                    color: white;
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                }
        
                h2,
                p {
                    color: #000;
                    text-align: center;
                }
        
                .h3-viz {
                    color: #fff;
                    text-align: left;
                    padding-left: 20px;
                    margin-left: 25px;
                }
        
                .h2-t,
                h3 {
                    color: #fff;
                    text-align: left;
                    padding-left: 20px;
                }
        
                .dashboard-box {
                    background-color: #fff;
                    padding: 20px;
                    margin: 20px;
                    border-radius: 10px;
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                    display: flex;
                }
        
                .dashboard-title {
                    background-color: #161d2f;
                    padding: 5px;
                    margin: 20px;
                    border-radius: 10px;
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                }
        
                .dashboard-title-circles {
                    background-color: #161d2f;
                    padding: 5px;
                    margin: 20px;
                    border-radius: 10px;
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                    width: 20%;
                }
        
                .chart-container {
                    flex: 1;
                    margin: 10px;
                }
        
                .chart-container-circle {
                    flex: 1;
                    margin: 30px;
                }
        
                .chart-box {
                    background-color: #161d2f;
                    padding: 20px;
                    border-radius: 10px;
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                    margin-left: 30px;
                }
        
                canvas {
                    width: 100%;
                    height: auto;
                }
        
                .chart {
                    width: 200px;
                    height: 200px;
                    border-radius: 50%;
                    overflow: hidden;
                    position: relative;
                    border: 2px solid #000;
                }
        
                .circle {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    clip-path: url(#circleClip);
                    transition: fill 1s ease-in-out;
                    fill: rgb(13, 67, 129);
                }
        
                .percentage {
                    fill: #fff;
                    font-size: 18px;
                    dominant-baseline: middle;
                    text-anchor: middle;
                }
            </style>
        </head>
        
        
        <body>
            <div class="dashboard-title">
                <h2 class="h2-t">Consumo</h2>
                <div class="dashboard-box">
                    <div class="chart-container">
                        <p>ATÉ AGORA</p>
                        <P>R$ ${dadosSimulados.totalReais.toFixed(2)}</p>
                        <hr>
                        <P>${dadosSimulados.totalKwh} kWh</P>
                    </div>
                    <div class="chart-container">
                        <p>META DO MÊS</p>
                        <P>R$ ${dadosSimulados.totalReais.toFixed(2)}</p>
                        <hr>
                        <P>${dadosSimulados.totalKwh} kWh</P>
                    </div>
                </div>
            </div>
        
        
            <div class="dashboard-title-circles">
                <h2 class="h2-t">Comparativo</h2>
                <div class="chart-container-circle">
                    <div class="chart-box">
                        <h3>META DO MÊS</h3>
                        <div class="chart">
                            <svg viewBox="0 0 100 100">
                                <defs>
                                    <clipPath id="circleClip">
                                        <rect width="100%" height="100%" x="0" y="0"></rect>
                                    </clipPath>
                                </defs>
                                <rect class="circle half-circle" width="100%" height="100%" x="0" y="0"></rect>
                                <text class="percentage" x="50" y="50">50%</text>
                            </svg>
                        </div>
                    </div>
        
                    <div class="chart-box">
                        <h3 class="h3-viz">VIZINHOS</h3>
                        <div class="chart">
                            <svg viewBox="0 0 100 100">
                                <defs>
                                    <clipPath id="circleClip">
                                        <rect width="100%" height="100%" x="0" y="0"></rect>
                                    </clipPath>
                                </defs>
                                <rect class="circle half-circle" width="100%" height="100%" x="0" y="63"></rect>
                                <text class="percentage" x="50" y="50">37%</text>
                            </svg>
                        </div>
                    </div>
                </div>
            </div>
        
        
            <script>
                function updateChart(value) {
                    var circle = document.querySelector('.circle');
                    var percentageText = document.querySelector('.percentage');
                    var angle = (value / 100) * 180; // Ângulo da metade do círculo
        
                    // Atualiza a posição da clip-path para ajustar a porcentagem
                    circle.style.clipPath = 'url(#circleClip)';
                    circle.style.clipPath = 'inset(' + (100 - value) + '% 0% 0% 0%)';
        
                    // Atualiza o texto da porcentagem
                    percentageText.textContent = value + '%';
                }
        
                updateChart(35);
        
            </script>
        
        
        
        
            <div class="dashboard-box">
                <div class="chart-container">
                    <div class="chart-box">
                        <h3>Consumo Diário</h3>
                        <canvas id="chartDiario"></canvas>
                    </div>
                </div>
                <div class="chart-container">
                    <div class="chart-box">
                        <h3>Consumo Semanal</h3>
                        <canvas id="chartSemanal"></canvas>
                    </div>
                </div>
            </div>
        
            <script>
                // Configurar gráfico diário
                var ctxDiario = document.getElementById('chartDiario').getContext('2d');
                new Chart(ctxDiario, {
                    type: 'line',
                    data: ${ JSON.stringify(dadosGraficoDiario) }
                        });
        
                // Configurar gráfico semanal
                var ctxSemanal = document.getElementById('chartSemanal').getContext('2d');
                new Chart(ctxSemanal, {
                    type: 'bar',
                    data: ${ JSON.stringify(dadosGraficoSemanal) }
                        });
            </script>
            
        </body>
        
        </html>
        `);
    } else {
        res.redirect('/');
    }
});

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
