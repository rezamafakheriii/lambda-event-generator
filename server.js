const express = require("express")
const app = express();

let routes = []

// Function to convert route with placeholders to regex pattern
function routeToRegex(route) {
  // Escape special characters and replace placeholders with regex patterns
  const regexPattern = route.replace(/\//g, '\\/')
                           .replace(/\{[\w-]+\}/g, '[^\\/]+');
  console.log("regex pattern", regexPattern)
  // Construct regex pattern
  return new RegExp(`^${regexPattern}$`);
}

function matchRoute(path) {
  // Loop through routes and check if path matches any route
  for (const route of routes) {
    const regex = routeToRegex(route);
    if (regex.test(path)) {
      return true;
    }
  }
  return false;
}

function routeHandler(req, res, next) {
  console.log("req path", req.url)
  console.log("matched", matchRoute(req.url))
  next()
}

module.exports = function StartServer(r) {
  routes = r
  app.use(routeHandler)

  app.listen(3000, () => {
    console.log(`Server is listening on port ${port}`);
  });
}