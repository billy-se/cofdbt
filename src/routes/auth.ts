import { Router, type Request, type Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { query } from '../db/index.js';

const router = Router();

const GOOGLE_CLIENT_ID = process.env.google_client_id || '';
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

router.post('/google', async (req: Request, res: Response) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ error: 'Token is required' });
    }

    if (!GOOGLE_CLIENT_ID) {
      return res.status(500).json({ error: 'Google Client ID is not configured on the server' });
    }

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(400).json({ error: 'Invalid Google token' });
    }

    const { email } = payload;

    let userResult = await query('SELECT * FROM users WHERE email = $1', [email]);

    if (userResult.rows.length === 0) {
      userResult = await query(
        `INSERT INTO users (email, password_hash, half_life_hours, daily_caffeine_target_mg)
         VALUES ($1, 'oauth_google', 5.0, 200.0)
         RETURNING *;`,
        [email]
      );
    }

    const user = userResult.rows[0];

    return res.json({
      message: 'Logged in successfully',
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Google Auth Error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
});

export default router;