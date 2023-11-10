// express_server.js

// ####################################
// # Dependancies
// ####################################
const express = require("express");
const cookieParser = require('cookie-parser');
const bcrypt = require("bcryptjs");

// ####################################
// # Application Setup
// ####################################
const app = express();
const PORT = 8080; // default port 8080

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// ####################################
// # Application Config
// ####################################
app.set("view engine", "ejs");

// ####################################
// # Middleware Setup
// ####################################
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ####################################
// # Route Handlers
// ####################################

// Home/Greeting
app.get("/", (req, res) => {
  res.send("Hello!");
});

// Hello Page
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

// ####################################
// # User Authentication
// ####################################

// Post to login
app.post('/login', (req, res) => {
  const username = req.body.username;
  res.cookie('username', username);
  res.redirect('/urls');
});

// POST to Logout
app.post('/logout', (req, res) => {
  res.clearCookie('username');
  res.redirect('/urls');
});

// POST to Register
app.post('/register', (req, res) => {
  const { email, password} = req.body;
  if (!email || !password) {
    return res.status(400).send('Email and password are required');
  }
  const hashedPassword = bcrypt.hashSync(password, 10);
});

// ####################################
// # URLs Page
// ####################################

// URLS
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// URLS Home
app.get("/urls", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    username: req.cookies["username"],
  };
  res.render("urls_index", templateVars);
});

// URLS Generate
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

// URLS Result for user that shows created short link
app.get("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  const longURL = urlDatabase[shortURL];
  const templateVars = { id: shortURL, longURL: longURL };
  res.render("urls_show", templateVars);
});

// Post for edit
app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id;
  if (urlDatabase[id]) {
    delete urlDatabase[id];
    res.redirect('/urls');
  } else {
    res.status(404).send('Not found');
  }
});

// Post for removal
app.post("/urls/:id/edit", (req, res) => {
  const id = req.params.id;
  const newLongURL = req.body.newLongURL;
  if (urlDatabase[id]) {
    urlDatabase[id] = newLongURL;
    res.redirect('/urls');
  } else {
    res.status(404).send('Not found');
  }
});

// Post URL for Shortening?
app.post("/urls", (req, res) => {
  const longURL = req.body.longURL;
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = longURL;
  res.redirect(`/urls/${shortURL}`);
});

app.post('/urls/:id', (req, res) => {
  const id = req.params.id;
  const newLongURL = req.body.newLongURL;
  if (urls[id]) {
    urls[id] = newLongURL;
    res.redirect('/urls');
  } else {
    res.status(404).send('Not found');
  }
});

// Generate a Random Short URL
function generateRandomString() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};
// ####################################
// # Server Initialization
// ####################################
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});