import jwt from 'jsonwebtoken';

// Hard-coded JWT secret; replace this with a secure key in production
const JWT_SECRET = 'mySuperSecretKey123456!';

function authenticateToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1]; // Expected format: "Bearer <token>"
  
  if (!token) {
    return res.sendStatus(403); // Forbidden if no token
  }

  // console.log("Token received:", token);
// console.log("Using secret:", JWT_SECRET);

  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.error('Token verification error:', err);
      return res.sendStatus(403); // Forbidden if token is invalid or expired
    }
    req.user = user; // Attach the decoded user info to the request
    next(); // Call the next middleware or route handler
  });
}
export default authenticateToken;


