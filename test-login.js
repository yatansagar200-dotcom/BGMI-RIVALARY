const http = require('http');

// First, register a test user
const registerData = JSON.stringify({
  playerName: "Test Player",
  phone: "7668261126",
  email: "test@example.com",
  password: "test123"
});

console.log("=== Step 1: Register Test User ===");

const registerOptions = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/contestants/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(registerData)
  }
};

const registerReq = http.request(registerOptions, (res) => {
  let body = '';
  res.on('data', (chunk) => {
    body += chunk;
  });
  res.on('end', () => {
    console.log('Register Status:', res.statusCode);
    console.log('Register Response:', body);
    
    // After registering, test login
    testLogin();
  });
});

registerReq.on('error', (e) => {
  console.error('Register Error:', e.message);
});

registerReq.write(registerData);
registerReq.end();

function testLogin() {
  console.log("\n=== Step 2: Test Login ===");
  
  const loginData = JSON.stringify({
    phone: "7668261126",
    password: "test123"
  });
  
  console.log("Login data:", loginData);

  const loginOptions = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/contestants/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(loginData)
    }
  };

  const loginReq = http.request(loginOptions, (res) => {
    let body = '';
    res.on('data', (chunk) => {
      body += chunk;
    });
    res.on('end', () => {
      console.log('Login Status:', res.statusCode);
      console.log('Login Response:', body);
    });
  });

  loginReq.on('error', (e) => {
    console.error('Login Error:', e.message);
  });

  loginReq.write(loginData);
  loginReq.end();
}
