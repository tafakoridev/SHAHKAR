const express = require("express");
const app = express();
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger.json");
app.use("/api", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
const port = 3000;
const jose = require("node-jose");
const bodyParser = require("body-parser");
const moment = require("moment/moment");
const fetch = require("cross-fetch");
require("dotenv").config();
const fs = require("fs");
let isRunning = true;
var momentj = require('moment-jalaali')
const currentMonth = momentj().format('jM');
app.use(bodyParser.json()); // to support JSON-encoded bodies
app.use(
  bodyParser.urlencoded({
    // to support URL-encoded bodies
    extended: true,
  })
);

function looksLikePem(s) {
  s = s.trim();
  const looksLike =
    (s.startsWith("-----BEGIN PRIVATE KEY-----") &&
      s.endsWith("-----END PRIVATE KEY-----")) ||
    (s.startsWith("-----BEGIN PUBLIC KEY-----") &&
      s.endsWith("-----END PUBLIC KEY-----")) ||
    (s.startsWith("-----BEGIN RSA PUBLIC KEY-----") &&
      s.endsWith("-----END RSA PUBLIC KEY-----")) ||
    (s.startsWith("-----BEGIN RSA PRIVATE KEY-----") &&
      s.endsWith("-----END RSA PRIVATE KEY-----"));
  return looksLike;
}
function getPublicKey(header) {
  options = { use: "enc" };

  const fieldValue = String(`-----BEGIN PUBLIC KEY-----
    MIGbMBAGByqGSM49AgEGBSuBBAAjA4GGAAQBZOZhO0214Wm243NHFcu9cwKizgfx
    cb3ZgOqH2jBb1nxExxjvwS8z7JKBjvdlM9yegAUoG6Q1wxFoaeKB2gl72zEBijiB
    mXcaKtmaB8RB37NywQMibdTHBbNZ9nNSfPYF0x4kSv7wG810N407cUdAJ7qYjRhc
    AfsnkdIhwvexpDflhD4=
    -----END PUBLIC KEY-----`)
    .trim()
    .replace(new RegExp("[^\x00-\x7F]", "g"), ""); // strip non - ASCII

  if (looksLikePem(fieldValue)) {
    // if de-serializing from PEM, apply the kid, if any
    return jose.JWK.asKey(fieldValue, "pem", { ...options, ...header });
  }

  let parseable = false;
  try {
    JSON.parse(fieldValue);
    parseable = true;
  } catch (_e1) {
    console.error("not parseable as JWKS?");
  }

  if (!parseable) {
    return Promise.resolve(null); // no key
  }

  return jose.JWK.asKeyStore(fieldValue).then((keystore) =>
    keystore.get(header)
  );
}

app.post('/stop', (req, res) => {
  isRunning = false;
  counter =0;
  res.json({ message: 'Loop  stopped.' });
});

// Function to check whether the loop should continue
function shouldContinue() {
  return isRunning;
}

async function encoder(payload) {
  const header = {
    alg: "ECDH-ES+A256KW",
    enc: "A256GCM",
    typ: "JWT",
    propY: false,
  };
  const key1 = await getPublicKey(header);
  const encryptOptions = {
      alg: "ECDH-ES+A256KW",
      fields: header,
      format: "compact",
    },
    cipher = jose.JWE.createEncrypt(encryptOptions, [
      { key: key1, reference: false },
    ]);
  cipher.update(JSON.stringify(payload), "utf8");
  const encoded = await cipher.final();
  return encoded;
}

async function requestSend(requestId, serviceNumber, identificationNo, token) {
  var myHeaders = {
    pid: "6469c3537dcac8295db57a0c",
    basicAuthorization: "Basic TW9yc2FfZGFkZ2FuOkVkOXg+YF85aw==",
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  var raw = JSON.stringify({
    requestId: requestId,
    serviceNumber: serviceNumber,
    identificationNo: identificationNo,
    identificationType: 0,
    serviceType: 2,
  });

  var requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: raw,
    redirect: "follow",
  };

  try {
    const req = await fetch(
      "https://op1.pgsb.ir/api/client/apim/v1/shahkaar/gwsh/serviceIDmatchingencrypted",
      requestOptions
    );
    const res = await req.text();
    return res;
  } catch (error) {
    console.log("error", error);
  }
}

function getRandom(length) {
  return Math.floor(
    Math.pow(10, length - 1) + Math.random() * 9 * Math.pow(10, length - 1)
  );
}

async function getToken() {
  var myHeaders = {
    Authorization:
      "Basic ZWYzMTJhMWY1YmRlNGViMjgzZDlmYzkzZTQ2OTY2MDM6RFJIZ3E5RURndGFzWXZmOA==",
    "Content-Type": "application/x-www-form-urlencoded",
  };
  var urlencoded = new URLSearchParams();
  urlencoded.append("grant_type", "password");
  urlencoded.append("username", process.env.ESV_username);
  urlencoded.append("password", process.env.ESV_password);

  var requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: urlencoded,
    redirect: "follow",
  };
  try {
    const req = await fetch("https://op1.pgsb.ir/oauth/token", requestOptions);
    const response = await req.json();
    return response;
  } catch (error) {
    res.send(error);
  }
}


function monthPersian(num) {
  switch (num) {
    case "1":
      return "فروردین"
      break;
      case "2":
      return "اردیبهشت"
      
      break;
    case "3":
      return "خرداد"
      break;
    case "4":
      return "تیر"
      break;
    case "5":
      return "مرداد"
      break;
    case "6":
      return "شهریور"
      break;
    case "7":
      return "مهر"
      break;
    case "8":
      return "آبان"
      break;
    case "9":
      return "آذر"
      break;
    case "10":
      return "دی"
      break;
    case "11":
      return "بهمن"
      break;
    case "12":
      return "اسفند"
      break;
  
    default:
      break;
  }
}
let currentmonthcounter = 0;
// Function to log time and response to a file
function logResult(response) {
  const time = new Date();
  const logEntry = `${time.toISOString()}: ${JSON.stringify(response)}\n`;
  fs.appendFile("result.log", logEntry, (err) => {
    if (err) throw err;
    console.log("Result logged.");
  });
}
let counter = 0;
// Function to increase the counter and store it in a file
function increaseCounter() {
  counter++;
  currentmonthcounter++;
  fs.writeFile("counter.txt", counter.toString(), (err) => {
    if (err) throw err;
    console.log("Counter increased and stored.");
  });
  fs.writeFile("counter.json", `{"${currentMonth}": ${currentmonthcounter.toString()}}`, (err) => {
    if (err) throw err;
    console.log("Counter increased and stored.");
  });
}


function stopLoop() {
  isRunning = false;
}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runLoop() {
  console.log(currentmonthcounter);
  for (let i = currentmonthcounter; i < process.env.COUNT && shouldContinue(); i++) {
    let restoken = await getToken();

    const dt = moment();
    const timestamp = dt.unix();
    const dateTimeString = dt.format("YYYYMMDDHHmm");
    const payload1 = {
      data: process.env.MOBILE,
      iat: timestamp,
    };

    const payload2 = {
      data: process.env.NATIONAL_CODE,
      iat: timestamp,
    };

    const serviceNumber = await encoder(payload1);
    const identificationNo = await encoder(payload2);

    logResult(
      await requestSend(
        `0949${dateTimeString}000${getRandom(5)}`,
        serviceNumber,
        identificationNo,
        restoken.access_token
      )
    );

    increaseCounter();
    // Wait for 5000 milliseconds before the next iteration
    const randomNumber = Math.floor(Math.random() * (7000 - 1000 + 1)) + 1000;

    await delay(randomNumber);
  }
}

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
  });

function processResponseLines(responseText) {
  // Split the response text into lines
  const lines = responseText.split('\n');

  // Create an array to store the lines
  const responseArray = [];

  // Iterate through each line and push it to the array
  lines.forEach(line => {
      // Remove leading and trailing whitespaces if needed
      const trimmedLine = line.trim();

      // Push the line to the array if it's not empty
      if (trimmedLine !== '') {
          responseArray.push("---------------");
          responseArray.push(trimmedLine);
      }
  });

  return responseArray;
}

app.get('/counter', (req, res) => {
  // Read log file
  fs.readFile('counter.txt', 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ error: 'Error reading result.log' });
    }
   
    res.json({"current counter": data});
  });
});

app.get('/currentmonthcounter', (req, res) => {
  // Read log file
  fs.readFile('counter.json', 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ error: 'Error reading result.log' });
    }
   const content = JSON.parse(data);
   currentmonthcounter = content[currentMonth];
    res.json(`${monthPersian(currentMonth)} : ${content[currentMonth]}`);
  });
});

app.get('/logs', (req, res) => {
  // Read log file
  fs.readFile('result.log', 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ error: 'Error reading result.log' });
    }
   
    res.json(processResponseLines(data));
  });
});

async function checkRequest(req, res) {
  isRunning = true;
  await runLoop();
  if(shouldContinue())
  res.send({
    result: `${process.env.COUNT} times run and log in result.log`,
  });
  else res.send({
    result: `proccess stoped and logs are in /result.log`,
  });
}

app.post("/start", checkRequest);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
