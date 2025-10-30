// app.js - simple client code for demos
document.getElementById('order').addEventListener('submit', function(e){
  // client-side convenience check (vulnerable)
  const price = document.getElementById('price').value;
  if (Number(price) < 10){
    alert('price too low - client blocked');
    e.preventDefault();
    return;
  }
  // let form submit to server (server trusts price)
});

document.getElementById('doFetch').addEventListener('click', async function(){
  const price = document.getElementById('fetch-price').value;
  const resp = await fetch('/api/checkout', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ item: 'A1001', price: Number(price) })
  });
  const j = await resp.json();
  console.log('checkout resp', j);
  alert('checkout: ' + JSON.stringify(j));
});

document.getElementById('doLogin').addEventListener('click', async function(){
  const resp = await fetch('/api/login', { method: 'POST' });
  const j = await resp.json();
  document.getElementById('login-res').innerText = JSON.stringify(j, null, 2);
});

document.getElementById('setRole').addEventListener('click', async function(){
  const role = document.getElementById('new-role').value;
  const resp = await fetch('/api/setrole', {
    method: 'PUT',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ role })
  });
  const j = await resp.json();
  document.getElementById('role-res').innerText = JSON.stringify(j, null, 2);
});

// Store a token in localStorage (bad practice) for demo
localStorage.setItem('access_token', 'demo-local-' + Math.random().toString(36).slice(2));


// === Additional demos added programmatically ===

// Race demo UI and client code
(function(document){
  document.body.insertAdjacentHTML('beforeend', `
  <div style="border:1px solid #ccc;padding:8px;margin:8px;">
    <h3>Race Demo</h3>
    <button id="race-btn">Optimistic Transfer (race)</button>
    <pre id="race-out"></pre>
  </div>
  `);
  document.getElementById('race-btn').addEventListener('click', async () => {
    // optimistic UI update
    document.getElementById('race-out').innerText = 'Status: SENT (optimistic)';
    // fire the network call that the server delays
    await fetch('/api/slow-transfer', { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({amount: 1})})
      .then(r => r.json())
      .then(j => document.getElementById('race-out').innerText = 'Server response: ' + JSON.stringify(j));
  });
})(document);

// Memory leak demo UI and client code
(function(){
  const leakyContainer = document.createElement('div');
  leakyContainer.style.border = '1px solid #ccc';
  leakyContainer.style.padding = '8px';
  leakyContainer.style.margin = '8px';
  leakyContainer.innerHTML = '<h3>Memory Leak Demo</h3><button id="leakBtn">Create Leaky Node</button><pre id="leakOut"></pre>';
  document.body.appendChild(leakyContainer);

  const leaky = []; // retained closures
  document.getElementById('leakBtn').addEventListener('click', () => {
    const node = document.createElement('div');
    node.innerHTML = '<input value="secret-data-'+Math.random().toString(36).slice(2)+'">';
    document.body.appendChild(node);
    // closure captures node
    leaky.push(function(){ return node.querySelector('input').value; });
    // remove node from DOM after 100ms - but closure still retains it
    setTimeout(()=> node.remove(), 100);
    document.getElementById('leakOut').innerText = 'Created leaky node. Total closures: ' + leaky.length;
  });
})();

// WebSocket client UI and client code
(function(){
  const wsHtml = `<div style="border:1px solid #ccc;padding:8px;margin:8px;">
    <h3>WebSocket Demo</h3>
    <button id="wsConnect">Connect WS</button>
    <button id="wsSend">Send Hello</button>
    <pre id="wsOut"></pre>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', wsHtml);
  let ws;
  document.getElementById('wsConnect').addEventListener('click', () => {
    ws = new WebSocket((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/');
    ws.onopen = () => document.getElementById('wsOut').innerText += 'OPEN\n';
    ws.onmessage = (m) => document.getElementById('wsOut').innerText += 'RECV: '+m.data+'\n';
    ws.onclose = () => document.getElementById('wsOut').innerText += 'CLOSED\n';
  });
  document.getElementById('wsSend').addEventListener('click', () => {
    if(ws && ws.readyState === 1) ws.send('hello-'+Math.random().toString(36).slice(2));
  });
})();
