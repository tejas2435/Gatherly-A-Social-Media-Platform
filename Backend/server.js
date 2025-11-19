import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from './db.js'; // PostgreSQL connection pool
import authenticateToken from './middleware/auth.js';
import multer from 'multer';
import http from 'http';
import { Server } from 'socket.io';
import dotenv from "dotenv";
dotenv.config();


const app = express();
const PORT = 3000;
const JWT_SECRET = 'mySuperSecretKey123456!';
const upload = multer({ storage: multer.memoryStorage() });
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

// Helper: Generate unique username
function generateUsername(name) {
  return name.toLowerCase().replace(/\s+/g, '') + Math.floor(Math.random() * 10000);
}

// =================== WELCOME ======================

app.get('/', (req, res) => {
  res.send('Hello from the backend');
});

// =================== AUTH ROUTES ======================

app.post('/auth/signup', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) return res.status(400).json({ message: 'User already exists !!' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const username = generateUsername(name);

    const result = await pool.query(
      'INSERT INTO users (name, email, password, username) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, email, hashedPassword, username]
    );
    res.status(201).json({ message: 'User created successfully', user: result.rows[0] });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/auth/signin', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, username: user.username, }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// =================== PROFILE ======================

app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    const user = result.rows[0];

    if (!user) return res.status(404).json({ message: 'User not found' });

    // Convert Buffer to base64 if exists
    if (user.profile_photo) {
      user.profile_photo = `data:image/png;base64,${user.profile_photo.toString('base64')}`;
    }

    if (user.cover_photo) {
      user.cover_photo = `data:image/png;base64,${user.cover_photo.toString('base64')}`;
    }

    res.json(user);
  } catch (err) {
    console.error('Error fetching profile', err);
    res.status(500).send('Server Error');
  }
});

app.get('/api/profile/:username', authenticateToken, async (req, res) => {
  const { username } = req.params;
  const currentUserId = req.user.id;

  try {
    // Fetch the user by username
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];

    // If user not found, send 404
    if (!user) return res.status(404).json({ error: 'User not found' });

    // If the account is private, check if the current user follows them
    // if (user.is_private && currentUserId !== user.id) {
    //   const followCheck = await pool.query(
    //     'SELECT 1 FROM followers WHERE follower_id = $1 AND followee_id = $2',
    //     [currentUserId, user.id]
    //   );
    //   if (!followCheck.rows.length) return res.status(403).json({ error: 'Private account' });
    // }

    // Convert binary buffers to base64 strings if photos exist
    if (user.profile_photo) {
      user.profile_photo = `data:image/png;base64,${user.profile_photo.toString('base64')}`;
    }
    if (user.cover_photo) {
      user.cover_photo = `data:image/png;base64,${user.cover_photo.toString('base64')}`;
    }

    // Send the user data as response
    res.json(user);

  } catch (err) {
    console.error('Error fetching profile by username:', err);
    res.status(500).send('Server Error');
  }
});


app.put('/api/profile', authenticateToken, upload.fields([
  { name: 'profilePhoto', maxCount: 1 },
  { name: 'coverPhoto', maxCount: 1 }
]), async (req, res) => {
  const { name, username, bio } = req.body;

  const profilePhoto = req.files?.profilePhoto?.[0]?.buffer || null;
  const coverPhoto = req.files?.coverPhoto?.[0]?.buffer || null;

  try {
    const result = await pool.query(
      `UPDATE users
       SET name = $1,
           username = $2,
           bio = $3,
           profile_photo = COALESCE($4, profile_photo),
           cover_photo = COALESCE($5, cover_photo)
       WHERE id = $6
       RETURNING *`,
      [
        name,
        username,
        bio,
        profilePhoto,
        coverPhoto,
        req.user.id
      ]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Convert image buffers to base64 strings
    if (user.profile_photo) {
      user.profile_photo = `data:image/png;base64,${user.profile_photo.toString('base64')}`;
    }
    if (user.cover_photo) {
      user.cover_photo = `data:image/png;base64,${user.cover_photo.toString('base64')}`;
    }

    res.json(user);
  } catch (err) {
    console.error('Error updating profile', err);
    if (err.code === '22021') {
      res.status(400).send('Invalid byte sequence in input');
    } else {
      res.status(500).send('Server Error');
    }
  }
});


app.get('/api/users/:username/profilephoto', async (req, res) => {
  const { username } = req.params;

  try {
    const result = await pool.query(
      'SELECT profile_photo FROM users WHERE username = $1',
      [username]
    );

    // If username not found in DB
    if (!result.rows.length) {
      return res.redirect(
        'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2281862025.jpg'
      );
    }

    const photo = result.rows[0].profile_photo;

    // If user exists but has no custom photo
    if (!photo) {
      return res.redirect(
        'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2281862025.jpg'
      );
    }

    // If a profile photo exists (BYTEA in DB)
    res.set('Content-Type', 'image/png');
    res.send(photo);
  } catch (err) {
    console.error('Error fetching profile photo:', err);
    res.status(500).send('Server error');
  }
});

app.get('/api/users/:username/coverphoto', async (req, res) => {
  const { username } = req.params; // Destructure username from the route params

  const user = await pool.query('SELECT cover_photo FROM users WHERE username = $1', [username]);
  if (user.rows.length) {
    res.set('Content-Type', 'image/png');
    res.send(user.rows[0].cover_photo);
  } else {
    res.status(404).send('Not found');
  }
});



// =================== FRIENDS ======================

app.get('/api/users/:id/friends', async (req, res) => {
  const userId = req.params.id;

  try {
    const result = await pool.query(
      `SELECT users.id, users.username, users.name, users.profile_photo
       FROM followers
       JOIN users ON followers.followee_id = users.id
       WHERE followers.follower_id = $1`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching following users:', err);  // log full error
    res.status(500).json({ error: 'Internal server error' });
  }
});


// =================== SEARCH ======================

app.get('/api/search', async (req, res) => {
  const query = req.query.query;

  if (!query) return res.status(400).json({ error: 'Query required' });

  try {
    const result = await pool.query(
      `SELECT id, username, name, profile_photo
FROM users
WHERE username ILIKE $1 OR name ILIKE $1
LIMIT 10
`,
      [`%${query}%`]
    );
    // res.json(result.rows);
        const users = result.rows.map(u => ({
      id: u.id,
      username: u.username,
      name: u.name,
      // ✅ Instead of sending BYTEA, send URL endpoint
      profile_photo: u.profile_photo
        ? `http://localhost:3000/api/users/${u.username}/profilephoto`
        : null,
    }));

    res.json(users);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// =================== NOTIFICATIONS ======================

app.get('/api/notifications', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(`
      SELECT 
        n.id, n.type, n.content, n.created_at,
        u.username, u.name, u.profile_photo
      FROM notifications n
      JOIN users u ON n.sender_id = u.id
      WHERE n.user_id = $1
      ORDER BY n.created_at DESC
    `, [userId]);

    const notifications = result.rows.map((n) => {
      let profilepic;

      if (n.profile_photo) {
        profilepic = `data:image/png;base64,${n.profile_photo.toString('base64')}`;
      } else {
        profilepic = 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2281862025.jpg';
      }

      return {
        id: n.id,
        type: n.type,
        content: n.content,
        time: n.created_at,
        is_read: n.is_read,
        user: {
          name: n.name,
          username: n.username,
          avatar: profilepic
        }
      };
    });

    res.json(notifications);
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.put('/api/notifications/mark-all-read', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    await pool.query(`
      UPDATE notifications
      SET is_read = TRUE
      WHERE user_id = $1 AND is_read = FALSE
    `, [userId]);

    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (err) {
    console.error('Error marking notifications as read:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/notifications/unread-count', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = FALSE',
      [userId]
    );
    res.json({ count: parseInt(result.rows[0].count, 10) });
  } catch (err) {
    console.error('Error getting unread count:', err);
    res.status(500).json({ error: 'Server error' });
  }
});



app.delete('/api/notifications/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  await pool.query('DELETE FROM notifications WHERE id = $1 AND user_id = $2', [id, userId]);

  res.json({ message: 'Notification deleted' });
});

app.delete('/api/notifications', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  await pool.query('DELETE FROM notifications WHERE user_id = $1', [userId]);

  res.json({ message: 'All notifications deleted' });
});

// Get unseen notification count for the logged-in user
app.get('/api/notifications/count', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      'SELECT COUNT(*) FROM notifications WHERE user_id = $1',
      [userId]
    );

    const count = parseInt(result.rows[0].count, 10);

    res.json({ count });
  } catch (err) {
    console.error('Error fetching notification count:', err);
    res.status(500).json({ error: 'Server error' });
  }
});


// =================== FOLLOWERS ======================

app.get('/api/followers', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.profile_photo FROM users u 
       INNER JOIN followers f ON u.id = f.follower_id 
       WHERE f.followee_id = $1`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Followers fetch error:', err);
    res.status(500).send('Server Error');
  }
});


app.get('/api/follow/status/:username', authenticateToken, async (req, res) => {
  const { username } = req.params;
  try {
    console.log('Checking follow status for username:', username);
    console.log('Authenticated user ID:', req.user.id);

    const followeeRes = await pool.query('SELECT id FROM users WHERE username = $1', [username]);

    if (!followeeRes.rows.length) {
      console.log('User not found');
      return res.status(404).json({ message: 'User not found' });
    }

    const followeeId = followeeRes.rows[0].id;

    const result = await pool.query(
      'SELECT 1 FROM followers WHERE follower_id = $1 AND followee_id = $2',
      [req.user.id, followeeId]
    );

    console.log('Follow check result:', result.rows);

    res.json({ following: result.rows.length > 0 });
  } catch (err) {
    console.error('Follow status check error:', err);  // 💥 THIS WILL SHOW THE ACTUAL ERROR
    res.status(500).json({ message: 'Internal server error' });
  }
});



app.get("/api/users/suggested", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(`
      SELECT u.id, u.name, u.username, u.profile_photo
      FROM users u
      WHERE u.id != $1
        AND u.id NOT IN (
          SELECT followee_id FROM followers WHERE follower_id = $1
        )
      ORDER BY RANDOM()
      LIMIT 5
    `, [userId]);

    const users = result.rows.map(user => ({
      id: user.id,
      name: user.name,
      username: user.username,
      profile_photo: user.profile_photo
        ? `data:image/png;base64,${Buffer.from(user.profile_photo).toString('base64')}`
        : null,
    }));

    res.json(users);
  } catch (err) {
    console.error("Error fetching suggested users:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});




app.post('/api/follow/follow/:username', authenticateToken, async (req, res) => {
  const { username } = req.params;
  const followerId = req.user.id;

  // console.log('req.user:', req.user);
  // console.log('followerId:', followerId);

  try {
    const followeeRes = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );
    if (!followeeRes.rows.length)
      return res.status(404).json({ message: 'User not found' });

    const followeeId = followeeRes.rows[0].id;

    // ✅ Get follower's username from DB
    const followerUsernameRes = await pool.query(
      'SELECT username FROM users WHERE id = $1',
      [followerId]
    );
    const followerUsername = followerUsernameRes.rows[0]?.username;

    console.log('followerUsername:', followerUsername);

    await pool.query(
      'INSERT INTO followers (follower_id, followee_id, follower_username) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
      [followerId, followeeId, followerUsername]
    );

    await pool.query(`
  INSERT INTO notifications (user_id, sender_id, type, content)
  VALUES ($1, $2, 'follow', $3)
`, [followeeId, followerId, 'started following you']);


    res.json({ message: 'Followed successfully' });
  } catch (err) {
    console.error('Follow error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// Unfollow user by username
app.post('/api/follow/unfollow/:username', authenticateToken, async (req, res) => {
  const { username } = req.params;
  const followerId = req.user.id;

  try {
    const followeeRes = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (!followeeRes.rows.length) return res.status(404).json({ message: 'User not found' });

    const followeeId = followeeRes.rows[0].id;

    await pool.query(
      'DELETE FROM followers WHERE follower_id = $1 AND followee_id = $2',
      [followerId, followeeId]
    );

    res.json({ message: 'Unfollowed successfully' });
  } catch (err) {
    console.error('Unfollow error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});


app.get('/api/friends/by-username/:username', async (req, res) => {
  const { username } = req.params;
  // console.log('✅ Username received:', username);

  try {
    const userRes = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userId = userRes.rows[0].id;

    const friendsRes = await pool.query(`
      SELECT u.id, u.username, u.name, u.profile_photo
      FROM followers f
      JOIN users u ON f.followee_id = u.id
      WHERE f.follower_id = $1
    `, [userId]);

    // Convert binary profile photos to base64
    const friends = friendsRes.rows.map(friend => ({
      id: friend.id,
      username: friend.username,
      name: friend.name,
      profile_photo: friend.profile_photo
        ? `data:image/png;base64,${Buffer.from(friend.profile_photo).toString('base64')}`
        : null,
    }));

    res.json(friends);
  } catch (err) {
    console.error('❌ Error in username-based friends route:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});


// =================== POSTS ======================

app.get('/api/posts', authenticateToken, async (req, res) => {
  const userId = req.user.id; // Extract user ID from JWT

  try {
    const result = await pool.query(`
      SELECT 
        posts.id,
        posts.content,
        posts.image,
        posts.created_at,
        posts.likes,
        posts.comments,
        users.name,
        users.username,
        users.profile_photo,
        EXISTS (
          SELECT 1 FROM post_likes 
          WHERE post_likes.post_id = posts.id 
          AND post_likes.user_id = $1
        ) AS is_liked
      FROM posts
      JOIN users ON posts.user_id = users.id
      ORDER BY posts.created_at DESC
    `, [userId]);

    const posts = result.rows.map(row => ({
      id: row.id,
      content: row.content,
      image: row.image
        ? `data:image/png;base64,${row.image.toString('base64')}`
        : null,
      timestamp: row.created_at,
      likes: row.likes,
      comments: row.comments,
      isLiked: row.is_liked, // ✅ now included
      user: {
        name: row.name,
        username: row.username,
        profile_photo: row.profile_photo
          ? `data:image/png;base64,${row.profile_photo.toString('base64')}`
          : null,
      }
    }));

    res.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error.stack);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});


app.get('/api/posts/:id/liked', authenticateToken, async (req, res) => {
  const postId = req.params.id;
  const userId = req.user.id;

  try {
    const result = await pool.query(
      'SELECT 1 FROM post_likes WHERE post_id = $1 AND user_id = $2',
      [postId, userId]
    );
    res.json({ liked: result.rowCount > 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to check like status' });
  }
});



app.post('/api/posts/:id/comment', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const postId = req.params.id;
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ error: "Comment content is required" });
  }

  try {
    // 1. Insert the comment
    const insertResult = await pool.query(
      `INSERT INTO comments (post_id, user_id, content, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING id, created_at`,
      [postId, userId, content]
    );

    const commentId = insertResult.rows[0].id;
    const created_at = insertResult.rows[0].created_at;

    // 2. Get commenter info
    const userResult = await pool.query(
      `SELECT username, name, profile_photo FROM users WHERE id = $1`,
      [userId]
    );
    const user = userResult.rows[0];

    // 3. Get post owner's user_id
    const postOwnerResult = await pool.query(
      `SELECT user_id FROM posts WHERE id = $1`,
      [postId]
    );

    if (postOwnerResult.rows.length > 0) {
      const postOwnerId = postOwnerResult.rows[0].user_id;

      // 4. Only notify if commenter is not the post owner
      if (postOwnerId !== userId) {
        const senderName = user.name || user.username;
        const notificationText = `commented on your post: "${content}"`;

        await pool.query(
          `INSERT INTO notifications (user_id, sender_id, type, content)
           VALUES ($1, $2, 'comment', $3)`,
          [postOwnerId, userId, notificationText]
        );
      }
    }

    // 5. Return the new comment
    res.json({
      id: commentId,
      username: user.username,
      name: user.name,
      avatar: user.profile_photo
        ? `data:image/png;base64,${user.profile_photo.toString('base64')}`
        : null,
      content,
      timestamp: created_at,
      likes: 0
    });
  } catch (err) {
    console.error("Error saving comment:", err);
    res.status(500).json({ error: "Failed to save comment" });
  }
});



app.get('/api/posts/:id/comments', authenticateToken, async (req, res) => {
  const postId = req.params.id;

  try {
    const result = await pool.query(
      `SELECT 
         comments.id,
         comments.content,
         comments.created_at,
         users.username,
         users.profile_photo
       FROM comments
       JOIN users ON comments.user_id = users.id
       WHERE comments.post_id = $1
       ORDER BY comments.created_at ASC`,
      [postId]
    );

    const comments = result.rows.map(row => ({
      id: row.id,
      content: row.content,
      timestamp: row.created_at,
      username: row.username,
      avatar: row.profile_photo
        ? `data:image/png;base64,${row.profile_photo.toString('base64')}`
        : "https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2281862025.jpg"
    }));

    res.json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

app.get('/api/commentcount', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT post_id, COUNT(*) AS comment_count
      FROM comments
      GROUP BY post_id
    `);

    res.json(result.rows); // [{ post_id: 1, comment_count: 3 }, ...]
  } catch (err) {
    console.error('Error fetching comment count:', err);
    res.status(500).json({ error: 'Server error' });
  }
});



app.delete('/api/posts/:id', authenticateToken, async (req, res) => {
  const postId = req.params.id;
  const userId = req.user.id;

  const result = await pool.query(
    'DELETE FROM posts WHERE id = $1 AND user_id = $2 RETURNING *',
    [postId, userId]
  );

  if (result.rowCount === 0) {
    return res.status(403).json({ message: 'Unauthorized or post not found' });
  }

  res.json({ message: 'Post deleted successfully' });
});



// Create a new post 
app.post('/api/posts', authenticateToken, upload.single('image'), async (req, res) => {
  const { content } = req.body;
  const image = req.file ? req.file.buffer : null;
  const userId = req.user.id;

  try {
    const postResult = await pool.query(`
      INSERT INTO posts (user_id, content, image, created_at, likes, comments, shares)
      VALUES ($1, $2, $3, NOW(), 0, 0, 0)
      RETURNING id, content, image, created_at, likes, comments, shares
    `, [userId, content, image]);

    const userResult = await pool.query(`
      SELECT name, username, profile_photo FROM users WHERE id = $1
    `, [userId]);

    const post = postResult.rows[0];
    const user = userResult.rows[0];

    res.status(201).json({
      post: {
        id: post.id,
        content: post.content,
        image: post.image
          ? `data:image/png;base64,${post.image.toString('base64')}`
          : null,
        timestamp: post.created_at,
        likes: post.likes,
        comments: post.comments,
        shares: post.shares,
        user: {
          name: user.name,
          username: user.username,
          profile_photo: user.profile_photo
            ? `data:image/png;base64,${user.profile_photo.toString('base64')}`
            : null,
        }
      }
    });
  } catch (error) {
    console.error('Error creating post:', error.stack);
    res.status(500).json({ error: 'Failed to create post' });
  }
});



app.get('/api/posts/:username', authenticateToken, async (req, res) => {
  const { username } = req.params;

  try {
    // Get user ID by username
    const userResult = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    const userId = userResult.rows[0].id;

    // Fetch posts by that user ID and also join user info
    const postsResult = await pool.query(`
      SELECT posts.*, users.username, users.name, users.profile_photo
      FROM posts
      JOIN users ON posts.user_id = users.id
      WHERE posts.user_id = $1
      ORDER BY posts.created_at DESC
    `, [userId]);

    // Convert image and profile_photo from Buffer to base64
    const postsWithImages = postsResult.rows.map(post => ({
      ...post,
      image: post.image ? `data:image/jpeg;base64,${post.image.toString('base64')}` : null,
      profile_photo: post.profile_photo
        ? `data:image/jpeg;base64,${post.profile_photo.toString('base64')}`
        : null
    }));

    res.json(postsWithImages);
  } catch (err) {
    console.error('Error fetching posts by username:', err);
    res.status(500).json({ message: 'Server error' });
  }
});



app.post('/api/posts/:id/like', authenticateToken, async (req, res) => {
  const postId = req.params.id;
  const senderId = req.user.id; // who liked the post

  try {
    const result = await pool.query(
      `SELECT EXISTS (
        SELECT 1 FROM post_likes WHERE post_id = $1 AND user_id = $2
      ) AS liked`,
      [postId, senderId]
    );

    const alreadyLiked = result.rows[0].liked;

    if (alreadyLiked) {
      // Unlike
      await pool.query(`DELETE FROM post_likes WHERE post_id = $1 AND user_id = $2`, [postId, senderId]);
      await pool.query(`UPDATE posts SET likes = likes - 1 WHERE id = $1`, [postId]);
      return res.status(200).json({ liked: false });
    } else {
      // Like
      await pool.query(`INSERT INTO post_likes (post_id, user_id) VALUES ($1, $2)`, [postId, senderId]);
      await pool.query(`UPDATE posts SET likes = likes + 1 WHERE id = $1`, [postId]);

      // Get post owner's user_id
      const postOwnerResult = await pool.query(`SELECT user_id FROM posts WHERE id = $1`, [postId]);
      const userId = postOwnerResult.rows[0]?.user_id;

      // Prevent self-like notification
      if (userId && userId !== senderId) {
        await pool.query(`
          INSERT INTO notifications (user_id, sender_id, type, content, post_id)
          VALUES ($1, $2, 'like', 'liked your post', $3)
        `, [userId, senderId, postId]);
      }

      return res.status(200).json({ liked: true });
    }
  } catch (err) {
    console.error('Like API error:', err);
    res.status(500).json({ error: 'Failed to toggle like' });
  }
});


// ===================== ACCOUNT SETTINGS ROUTES =====================

// CHANGE PASSWORD
app.put('/api/users/change-password', authenticateToken, async (req, res) => {
  try {
    console.log('🟡 [CHANGE PASSWORD] Request received');
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current and new password are required" });
    }

    const result = await pool.query('SELECT password FROM users WHERE id = $1', [userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const currentPasswordHash = result.rows[0].password;
    const isCurrentValid = await bcrypt.compare(currentPassword, currentPasswordHash);
    if (!isCurrentValid) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    const isSame = await bcrypt.compare(newPassword, currentPasswordHash);
    if (isSame) {
      return res.status(400).json({ error: "New password must be different" });
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await pool.query(
      'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2',
      [hashed, userId]
    );

    console.log('✅ Password updated successfully for user:', userId);
    return res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error('❌ [CHANGE PASSWORD] Error:', err);
    return res.status(500).json({ error: "Server error" });
  }
});


// CHANGE EMAIL
app.put('/api/users/change-email', authenticateToken, async (req, res) => {
  try {
    console.log('🟡 [CHANGE EMAIL] Request received');
    const userId = req.user.id;
    const { currentPassword, newEmail } = req.body;

    if (!currentPassword || !newEmail) {
      return res.status(400).json({ error: "Current password and new email required" });
    }

    const result = await pool.query('SELECT password, email FROM users WHERE id = $1', [userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = result.rows[0];
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Incorrect current password" });
    }

    const emailCheck = await pool.query('SELECT id FROM users WHERE email = $1', [newEmail]);
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ error: "Email already in use" });
    }

    await pool.query(
      'UPDATE users SET email = $1, updated_at = NOW() WHERE id = $2',
      [newEmail, userId]
    );

    console.log('✅ Email updated successfully for user:', userId);
    return res.json({ message: "Email changed successfully" });
  } catch (err) {
    console.error('❌ [CHANGE EMAIL] Error:', err);
    return res.status(500).json({ error: "Server error" });
  }
});


// DELETE ACCOUNT
app.delete('/api/users/delete', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('🟡 [DELETE ACCOUNT] User ID:', userId);

    await pool.query('DELETE FROM users WHERE id = $1', [userId]);

    console.log('✅ Account deleted:', userId);
    return res.json({ message: "Account deleted successfully" });
  } catch (err) {
    console.error('❌ [DELETE ACCOUNT] Error:', err);
    return res.status(500).json({ error: "Server error" });
  }
});



// =================== CHAT SYSTEM ======================

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});


io.on("connection", (socket) => {
  console.log("🟢 Socket connected:", socket.id);

  // NEW: user joins their personal room (not a convo room)
  socket.on("registerUser", (userId) => {
    if (!userId) return;
    socket.join(`user:${userId}`);
    console.log(`User ${userId} joined personal room user:${userId}`);
  });

  socket.on("joinRoom", (conversationId) => {
    if (!conversationId) return;
    socket.join(String(conversationId));
    console.log(`Joined convo room ${conversationId}`);
  });

  socket.on("sendMessage", async (data) => {
    try {
      const { conversationId, senderId, text, content } = data;
      const messageText = text || content;
      if (!conversationId || !senderId || !messageText?.trim()) return;

      // Save
      const result = await pool.query(
        `INSERT INTO messages (conversation_id, sender_id, content, created_at)
         VALUES ($1, $2, $3, NOW())
         RETURNING id, conversation_id, sender_id, content, created_at`,
        [conversationId, senderId, messageText]
      );
      const msg = result.rows[0];

      // Sender profile
      const userRes = await pool.query(
        "SELECT username, name, profile_photo FROM users WHERE id = $1",
        [senderId]
      );
      const sender = userRes.rows[0] || {};
      const avatar = sender.profile_photo
        ? `data:image/png;base64,${sender.profile_photo.toString("base64")}`
        : null;

      const payload = {
        id: msg.id,
        conversation_id: msg.conversation_id,
        sender_id: msg.sender_id,
        content: msg.content,
        text: msg.content,
        created_at: new Date(msg.created_at).toISOString(),
        sender_name: sender.name,
        sender_username: sender.username,
        sender_avatar: avatar,
      };

      // Find both participants for global pings
      const convoRes = await pool.query(
        "SELECT user1_id, user2_id FROM conversations WHERE id = $1",
        [conversationId]
      );
      const { user1_id, user2_id } = convoRes.rows[0];

      // Realtime to users with chat open
      io.to(String(conversationId)).emit("receiveMessage", payload);

      // NEW: global ping to both users so headers update anywhere
      io.to(`user:${user1_id}`).emit("chat:ping", { conversation_id: conversationId });
      io.to(`user:${user2_id}`).emit("chat:ping", { conversation_id: conversationId });
    } catch (err) {
      console.error("❌ Socket sendMessage error:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("🔴 Socket disconnected:", socket.id);
  });
});


app.get("/api/conversations", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const { id: userId } = jwt.verify(token, process.env.JWT_SECRET);

    const result = await pool.query(
      `
      SELECT 
        c.id,
        c.user1_id,
        c.user2_id,
        c.updated_at,
        u.id AS other_id,
        u.username AS other_username,
        u.name AS other_name,
        u.profile_photo AS other_profile_photo,
        (
          SELECT COUNT(*) 
          FROM messages m
          LEFT JOIN message_reads r 
            ON r.message_id = m.id 
            AND r.user_id = $1
          WHERE m.conversation_id = c.id
            AND m.sender_id != $1
            AND r.message_id IS NULL
        ) AS unread_count
      FROM conversations c
      JOIN users u 
        ON (CASE WHEN c.user1_id = $1 THEN c.user2_id ELSE c.user1_id END) = u.id
      WHERE $1 IN (c.user1_id, c.user2_id)
      ORDER BY c.updated_at DESC; -- ✅ sort by latest update
      `,
      [userId]
    );

    const conversations = result.rows.map((r) => ({
      id: r.id,
      other_id: r.other_id,
      other_username: r.other_username,
      other_name: r.other_name,
      other_profile_photo: `http://localhost:3000/api/users/${r.other_username}/profilephoto`,
      unread_count: Number(r.unread_count || 0),
      updated_at: r.updated_at, // Keep timestamp
    }));

    res.json(conversations);
  } catch (err) {
    console.error("💥 /api/conversations failed:", err);
    res.status(500).json({ error: err.message });
  }
});



app.post('/api/conversations', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const { id: userId } = jwt.verify(token, process.env.JWT_SECRET);
    const { otherUserId } = req.body;

    if (!otherUserId) return res.status(400).json({ error: 'otherUserId required' });

    // check if conversation already exists
    const existing = await pool.query(
      `SELECT * FROM conversations
       WHERE (user1_id=$1 AND user2_id=$2)
          OR (user1_id=$2 AND user2_id=$1)`,
      [userId, otherUserId]
    );

    let convo;
    if (existing.rows.length > 0) {
      convo = existing.rows[0];
    } else {
      const created = await pool.query(
        `INSERT INTO conversations (user1_id, user2_id)
         VALUES ($1, $2)
         RETURNING *`,
        [userId, otherUserId]
      );
      convo = created.rows[0];
    }

    const otherRes = await pool.query(
      `SELECT id, username, name FROM users WHERE id=$1`,
      [otherUserId]
    );
    const other = otherRes.rows[0];

    res.json({
      id: convo.id,
      other_id: other.id,
      other_name: other.name,
      other_username: other.username,
      other_profile_photo: `http://localhost:3000/api/users/${other.username}/profilephoto`,
    });
  } catch (err) {
    console.error('Error creating conversation:', err);
    res.status(500).json({ error: 'Server error' });
  }
});


app.get("/api/messages/:conversationId", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const { id: userId } = jwt.verify(token, process.env.JWT_SECRET);
    const { conversationId } = req.params;

    const result = await pool.query(
      `
      SELECT 
        m.id,
        m.content AS text,
        m.sender_id,
        m.created_at,
        u.username AS sender_username,
        u.name AS sender_name
      FROM messages m
      JOIN users u ON m.sender_id=u.id
      WHERE m.conversation_id=$1
      ORDER BY m.created_at ASC
    `,
      [conversationId]
    );

    const messages = result.rows.map((m) => ({
      ...m,
      sender_avatar: `http://localhost:3000/api/users/${m.sender_username}/profilephoto`,
    }));

    // 🧠 Mark all messages as read for this user
    await pool.query(
      `
      INSERT INTO message_reads (user_id, message_id)
      SELECT $1, id FROM messages
      WHERE conversation_id = $2
        AND sender_id != $1
      ON CONFLICT DO NOTHING
      `,
      [userId, conversationId]
    );

    res.json(messages);
  } catch (err) {
    console.error("Error fetching messages:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});




// 🗑️ Delete entire chat (conversation + its messages)
app.delete("/api/conversations/:conversationId", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const { id: userId } = jwt.verify(token, process.env.JWT_SECRET);
    const { conversationId } = req.params;

    // Ensure the user owns this conversation
    const convo = await pool.query(
      `SELECT * FROM conversations WHERE id=$1 AND ($2 IN (user1_id, user2_id))`,
      [conversationId, userId]
    );

    if (convo.rows.length === 0)
      return res.status(403).json({ error: "Forbidden" });

    // Delete all messages first (foreign key safe)
    await pool.query(`DELETE FROM messages WHERE conversation_id=$1`, [conversationId]);

    // Delete conversation itself
    await pool.query(`DELETE FROM conversations WHERE id=$1`, [conversationId]);

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Delete conversation failed:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});


// ================= START SERVER =================

server.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});