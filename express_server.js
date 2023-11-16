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
const PORT = 8085; // default port 8080

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
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

// GET to home
app.get("/", (req, res) => {
  res.send("Hello!");
});

// GET to hello
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

// ####################################
// # User Authentication
// ####################################

// Get to login page
app.get('/login', (req, res) => {
  const userId = req.cookies["userid"];
  const user = users[userId];

  // Render the login page template
  res.render('user_login', { user });
});

// Get to registeration page
app.get("/register", (req, res) => {
  const userId = req.cookies["userid"];
  const user = users[userId];

  res.render("user_reg", { user });
});

// POST to login
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  // Find user by email
  const user = Object.values(users).find(user => user.email === email);

  if (!user) {
    // User not found
    return res.redirect('/login');
  }
  
  if (bcrypt.compareSync(password, user.password)) {
    // set cookie with the user's id if success  
    res.cookie('userid', user.id);
    res.redirect('/urls');
  } else {
    // Password does not match
    res.status(401).send('Login failed: Incorrect password.');
  }
});

// POST to logout
app.post('/logout', (req, res) => {
  res.clearCookie('userid');
  res.redirect('/urls');
});

// POST to register
app.post('/register', (req, res) => {
  const { email, password} = req.body;
  if (!email || !password) {
    return res.redirect('/register');
  }
  const userId = generateRandomString();
  const hashedPassword = bcrypt.hashSync(password, 10);

  const existingUser = Object.values(users).find(user => user.email === email);
  if (existingUser) {
    return res.status(400).send('Email is already registered');
  }

  users[userId] = { id: userId, email: email, password: hashedPassword };
  res.cookie('userid', userId);
  res.redirect('/urls');
});

// ####################################
// # URLs Page
// ####################################

// GET to URLS database
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// GET to URLS home
app.get("/urls", (req, res) => {
  const userId = req.cookies["userid"];
  const user = users[userId];

  const templateVars = {
    urls: urlDatabase,
    user: user,
  };
  res.render("urls_index", templateVars);
});

// GET to URLS generate
app.get("/urls/new", (req, res) => {
  const userId = req.cookies["userid"];
  const user = users[userId];

  res.render("urls_new", { user });
});

// GET to URLS result for user that shows created short link
app.get("/urls/:id", (req, res) => {
  const userId = req.cookies["userid"];
  const user = users[userId];
  
  const shortURL = req.params.id;
  const longURL = urlDatabase[shortURL];
  const templateVars = { 
    id: shortURL, 
    longURL: longURL,
    user: user 
  };
  res.render("urls_show", templateVars);
});

// POST for edit
app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id;
  if (urlDatabase[id]) {
    delete urlDatabase[id];
    res.redirect('/urls');
  } else {
    res.status(404).send('Not found');
  }
});

// POST for removal
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

// POST URL for shortening
app.post("/urls", (req, res) => {
  const longURL = req.body.longURL;
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = longURL;
  res.redirect(`/urls/${shortURL}`);
});

// POST to URLS search
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


// ####################################
// # Server Initialization
// ####################################
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

// ####################################
// # Helper Function
// ####################################

// Generate a random short URL
function generateRandomString() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};