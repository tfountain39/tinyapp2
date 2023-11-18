// express_server.js

// ####################################
// # Dependancies
// ####################################
const express = require("express");
const cookieSession = require('cookie-session');
const bcrypt = require("bcryptjs");
const { 
  generateRandomString, 
  requireLogin, 
  urlsForUser, 
  getUserByEmail } = require('./helpers');


// ####################################
// # Application Setup
// ####################################
const app = express();
const PORT = 8080; // default port 8080

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
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
app.use(cookieSession({
  name: 'session',
  keys: ['beepboop'], // Replace 'your-secret-key' with your actual secret key
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
}));


// ####################################
// # Route Handlers
// ####################################

// GET to home
app.get("/", (req, res) => {
  const userId = req.session.session;
  const user = users[userId]; // Fetch the user using the userid cookie
  if (!userId) {
    res.redirect('/login');
  } else {
    const userUrls = urlsForUser(userId, urlDatabase);
    res.render("urls_index", { urls: userUrls, user }); // Pass the user to the template
  }
});

// ####################################
// # User Authentication
// ####################################

app.get('/login', (req, res) => {
  // Check if user is already logged in
  const userId = req.session.session;
  const user = users[userId] || null; // Fetch the user using the userid cookie or set to null if not logged in
  if (user) {
    // User is logged in, redirect to /urls
    return res.redirect('/urls');
  }
  // User is not logged in, render the login page
  const error = req.query.error || null;
  res.render('user_login', { user, error });
});

// Get to registeration page
app.get("/register", (req, res) => {
  if (req.session.session) {
    return res.redirect('/urls');
  }
  res.render('user_reg', { user: null });
});

// POST to login
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = getUserByEmail(email, users) ;

  if (!user) {
    // User not found, redirect to login page with an error message
    res.redirect('/login?error=User not found');
    return;
  }

  if (bcrypt.compareSync(password, user.password)) { // Compare hashed password with provided password
    // set cookie with the user's id if success  
    req.session.session = userId;
    const loggedInUser = users[req.cookies["userid"]] || null;
    res.render('user_login', { user: loggedInUser, error: null });
  } else {
    // Password does not match, redirect to login page with an error message
    res.redirect('/login?error=Login failed: Incorrect password.');
  }
});

// POST to register
app.post('/register', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.redirect('/register');
  }
  const userId = generateRandomString();
  const hashedPassword = bcrypt.hashSync(password, 10); // Hash the password

  const existingUser = Object.values(users).find(user => user.email === email);
  if (existingUser) {
    return res.status(400).send('Email is already registered');
  }

  users[userId] = { id: userId, email: email, password: hashedPassword };
  const user = users[userId];
  req.session.session = user ? user.id : null;
  res.redirect('/urls');
});

app.post('/logout', (req, res) => {
  // Clear the userid cookie to log the user out
  req.session = null;
  res.redirect('/login');
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
  const userId = req.session.session;
  const user = users[userId] || null; // Set user to null if not logged in
  if (!userId) {
    const error = {
      errorCode: '403 Forbidden',
      errorMessage: 'You must be logged in to view URLs.'
    };
    return res.render("urls_index", { error: error, user: user, urls: {} });
  }
  const userUrls = urlsForUser(userId, urlDatabase);
  res.render("urls_index", { urls: userUrls, user: user });
});

// GET to URLS generate
app.get("/urls/new", requireLogin, (req, res, users) => {
  const userId = req.session.session;
  if (!userId) {
    return res.redirect('/login');
  }
  const user = users[userId];
  res.render("urls_new", { user });
});

// Short linker
app.get('/u/:id', (req, res) => {
  const shortURL = req.params.id;

  // Check if the short URL exists in the database
  if (!urlDatabase[shortURL]) {
    // If it doesn't exist, send an error message
    return res.status(404).send('<html><body><h1>404 Not Found</h1><p>The requested short URL does not exist.</p></body></html>');
  }

  // If it exists, redirect to the original URL or handle as needed
  const longURL = urlDatabase[shortURL].longURL;
  res.redirect(longURL);
});

// GET to URLS result for user that shows created short link
app.get("/urls/:id", (req, res) => {
  const userId = req.session.session;
  const user = users[userId];
  
  const shortURL = req.params.id;
  const urlObject = urlDatabase[shortURL];
  if (!urlObject) {
    return res.status(404).send("URL not found");
  }
  const longURL = urlObject.longURL;
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
    urlDatabase[id].longURL = newLongURL;
    res.redirect('/urls');
  } else {
    res.status(404).send('Not found');
  }
});

// POST URL for shortening
app.post("/urls", (req, res) => {
  const userId = req.sessions;
  if (!userId) {
    // User is not logged in, redirect to the login page
    return res.redirect('/login');
  }

  const longURL = req.body.longURL;
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = { longURL: longURL, userID: userId };
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

