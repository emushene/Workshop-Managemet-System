import express = require('express');
const router = express.Router();
import db from '../database';
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

console.log('Auth routes module loaded');

// Login endpoint
router.post('/login', (req: express.Request, res: express.Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  db.get('SELECT * FROM Users WHERE username = ?', [username], (err: Error, user: any) => {
    if (err) {
      return res.status(500).json({ message: err.message });
    }
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    bcrypt.compare(password, user.password, (err: Error, result: boolean) => {
      if (err) {
        return res.status(500).json({ message: err.message });
      }
      if (!result) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // User authenticated, generate JWT
      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        'your_jwt_secret', // TODO: Replace with a strong secret from environment variables
        { expiresIn: '1h' }
      );

      res.json({ message: 'Login successful', token, user: { id: user.id, username: user.username, role: user.role } });
    });
  });
});

export default router;
