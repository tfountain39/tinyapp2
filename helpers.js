
// Generate a random short URL
function generateRandomString() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

function requireLogin(req, res, next) {
  const userId = req.session.session;
  if (userId && users[userId]) {
    next();
  } else {
    // User is not logged in, redirect to the login page
    res.redirect('/login');
  }
}

function urlsForUser(id) {
  let filteredUrls = {};
  for (let url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      filteredUrls[url] = urlDatabase[url];
    }
  }
  return filteredUrls;
}

function getUserByEmail(email) {
  return Object.values(users).find(user => user.email === email);
}

module.exports = {
  generateRandomString,
  requireLogin,
  urlsForUser,
  getUserByEmail
};