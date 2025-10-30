const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Simple in-memory "user"
let user = { id: 'u1', role: 'user', balance: 0 };

// Endpoint that accepts form POST (Elements demo) - intentionally vulnerable: trusts client price
app.post('/submit', (req, res) => {
  const itemId = req.body.itemId;
  const price = req.body.price;
  // Vulnerable: server trusts client-provided price
  user.balance += Number(price || 0);
  res.json({ ok: true, itemId, price: price, balance: user.balance });
});

// API endpoint used by fetch (Network demo) - trusts client payload
app.post('/api/checkout', (req, res) => {
  const payload = req.body;
  // Vulnerable: accepts price from client
  user.balance += Number(payload.price || 0);
  res.json({ status:'success', newBalance: user.balance, received: payload });
});

// Role change endpoint - vulnerable to tampering (Network demo)
app.put('/api/setrole', (req, res) => {
  const r = req.body.role;
  // No auth check - vulnerable
  user.role = r || user.role;
  res.json({ ok: true, role: user.role });
});

// Endpoint to return a simple token (Application demo)
app.post('/api/login', (req, res) => {
  // Return a fake JWT-like token (no signature, for demo)
  const token = Buffer.from(JSON.stringify({userId:user.id, role: user.role, ts:Date.now()})).toString('base64');
  // Intentionally set not HttpOnly to demonstrate bad practice in the demo
  res.cookie('access_token', token, { httpOnly: false, secure: false });
  res.json({ token, note: 'This token is stored in cookie (HttpOnly=false) and accessible via JS in this PoC.' });
});

// Endpoint to show current user state
app.get('/api/user', (req, res) => {
  res.json({ user });
});

// slow transfer for race demo
app.post('/api/slow-transfer', async (req, res) => {
  await new Promise(r => setTimeout(r, 3000)); // 3s delay
  user.balance += Number(req.body.amount || 0);
  res.json({ ok: true, balance: user.balance, processedAt: Date.now() });
});

// serve vuln.html at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'vuln.html'));
});

// Start HTTP server and WebSocket server
const http = require('http');
const server = http.createServer(app);
const WebSocket = require('ws');
const wss = new WebSocket.Server({ server });

wss.on('connection', function connection(ws){
  ws.on('message', function incoming(msg){
    console.log('received: %s', msg);
    // echo back with server timestamp
    ws.send(JSON.stringify({ echo: msg, ts: Date.now() }));
  });
  // send periodic message
  const interval = setInterval(() => {
    ws.send(JSON.stringify({ serverTime: Date.now() }));
  }, 5000);
  ws.on('close', () => clearInterval(interval));
});

server.listen(port, () => {
  console.log('PoC server running on http://localhost:' + port);
});
