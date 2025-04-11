
const express = require('express');
const app = express();
const port = 5000;

// Basic HTML template
const html = `
<!DOCTYPE html>
<html>
<head>
    <title>HanakoBot-MD</title>
    <style>
        body {
            background: #1a1a1a;
            color: #fff;
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
        }
        .status {
            text-align: center;
            padding: 20px;
            border-radius: 10px;
            background: #2a2a2a;
        }
        .online {
            color: #4CAF50;
            font-size: 24px;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="status">
        <h1>HanakoBot-MD</h1>
        <p class="online">Hecho por SoyMaycol</p>
    </div>
</body>
</html>
`;

app.get('/', (req, res) => {
    console.log(`📝 Nueva conexión desde: ${req.ip}`);
    res.send(html);
});

module.exports = { app, port };
