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
    const consumoDiario = [30, 31, 32, 31, 30, 25, 20, 18, 20, 17, 24, 35, 40, 35, 30, 28, 35, 30, 35, 30, 25, 28, 30, 32];
    const consumoSemanal = [70, 78, 83, 72, 60, 110, 120];

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
            color: black;
            text-align: center;
            font-weight: bold;
        }

        .p-meta {
            color: green;
            text-align: center;
            font-weight: bold;
        }

        .p-meta-red{
            color: red;
            text-align: center;
            font-weight: bold;
        }

        .h3-viz {
            color: #fff;
            text-align: left;
            padding-left: 20px;
            padding-top: 50px;
            margin-left: 64px;
            display: inline-block;
            margin-right: 110px;
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
            box-shadow: 0 4px 8px rgba(0, 0, 0, 1);
            display: flex;
            width: 60%;
            margin-left: 350px;
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
            display: flex;
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
            margin-left: 30px;
            display: flex;
        }

        .chart-box-graph {
            background-color: #161d2f;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 1);
            width: 50%;
        }

        canvas {
            width: 100%;
            height: 50%;
        }

        .chart {
            width: 200px;
            height: 200px;
            border-radius: 50%;
            overflow: hidden;
            position: relative;
            border: 2px solid #000;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 1);
        }

        .chart-first {
            width: 200px;
            height: 200px;
            border-radius: 50%;
            overflow: hidden;
            position: relative;
            border: 2px solid #000;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 1);
            margin-right: 100px;
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

        table {
            margin-top: 7%;
            border-collapse: collapse;
            width: 100%;
        }

        th,
        td {
            border: 1px solid #dddddd;
            text-align: center;
            padding: 8px;
        }

        th {
            background-color:  rgb(13, 67, 129);
        }
    </style>
</head>


<body>
    <div class="dashboard-title">
        <h2 class="h2-t">Consumo</h2>
        <div class="dashboard-box">
            <div class="chart-container">
                <p>ATÉ AGORA</p>
                <P>R$ 89.67</p>
                <hr>
                <P>57.8 kWh</P>
            </div>
            <div class="chart-container">
                <p class="p-meta">META DO MÊS</p>
                <P class="p-meta">R$ </p>
                <hr>
                <P class="p-meta"> kWh</P>
            </div>
        </div>
    </div>


    <div class="dashboard-title-circles">
        <h2 class="h2-t">Comparativo</h2>
        <div class="chart-container-circle">
            <h3 class="h3-viz">META DO MÊS </h3>
            <h3 class="h3-viz">VIZINHOS</h3>
            <div class="chart-box">
                <div class="chart-first">
                    <svg viewBox="0 0 100 100">
                        <defs>
                            <clipPath id="circleClip">
                                <rect width="100%" height="100%" x="0" y="0"></rect>
                            </clipPath>
                        </defs>
                        <rect class="circle half-circle" width="100%" height="100%" x="0" y="83.5"></rect>
                        <text class="percentage" x="50" y="50">16.5%</text>
                    </svg>
                </div>
                <div class="chart">
                    <svg viewBox="0 0 100 100">
                        <defs>
                            <clipPath id="circleClip">
                                <rect width="100%" height="100%" x="0" y="0"></rect>
                            </clipPath>
                        </defs>
                        <rect class="circle half-circle" width="100%" height="100%" x="0" y="68"></rect>
                        <text class="percentage" x="50" y="50">32%</text>
                    </svg>
                </div>
            </div>
        </div>
        <div class="chart-container-circle">
            <h2 class="h2-t">Histórico de Metas</h2>
            <table>
                <thead>
                    <tr>
                        <th>Mês</th>
                        <th>Consumo</th>
                        <th>Meta</th>
                        <th>Economia</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Julho</td>
                        <td>400 KWh</td>
                        <td>453 KWh</td>
                        <td><p class="p-meta">11.69%</p></td>
                    </tr>
                    <tr>
                        <td>Agosto</td>
                        <td>350 kWh</td>
                        <td>300 KWh</td>
                        <td><p class="p-meta-red">-16.66%</p></td>
                    </tr>
                    <tr>
                        <td>Setembro</td>
                        <td>474 KWh</td>
                        <td>350 KWh</td>
                        <td><p class="p-meta-red">-35.42%</p></td>
                    </tr>
                    <tr>
                        <td>Outubro</td>
                        <td>350 KWh</td>
                        <td>450 KWh</td>
                        <td><p class="p-meta">22.22%</p></td>
                    </tr>
                </tbody>
            </table>
        </div>
        <div>

        </div>
    </div>


    <div class="dashboard-title">
        <div class="chart-container">
            <div class="chart-box-graph">
                <h3>Consumo Diário</h3>
                <canvas id="chartDiario"></canvas>
            </div>
        </div>
        <div class="chart-container">
            <div class="chart-box-graph">
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
