const express = require('express');
const app = express();
const { Pool } = require('pg');
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'mighty_db',
  password: 'postgres',
  port: '5432'
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// User sign up endpoint
app.post('/api/users/signup', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if(userExists.rows.length > 0)
    {
        res.status(409).json({message: 'Email is already registered'});
    }
    else{
          const result = await pool.query('INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING user_id', [name, email, password]);
          const newUserId = result.rows[0].user_id;
          res.status(201).json({ message: 'User created', userId: newUserId });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// User login endpoint
app.post('/api/users/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1 AND password = $2', [email, password]);
    if (result.rows.length > 0) {
      const user = result.rows[0];
      res.status(200).json({ message: 'Login successful', userId: user.id });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new post endpoint
app.post('/api/posts', async (req, res) => {
    const { userId, content } = req.body;
    try {
      const result = await pool.query('INSERT INTO posts (user_id, message) VALUES ($1, $2) RETURNING post_id', [userId, content]);
      const newPostId = result.rows[0].post_id;
      res.status(201).json({ message: 'Post created', postId: newPostId });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Get all posts endpoint
  app.get('/api/posts', async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM posts ORDER BY created_at DESC');
      const posts = result.rows;
      res.status(200).json(posts);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Get a specific post by ID endpoint
  app.get('/api/posts/:postId', async (req, res) => {
    const postId = req.params.postId;
    try {
      const result = await pool.query('SELECT * FROM posts WHERE post_id = $1', [postId]);
      if (result.rows.length > 0) {
        const post = result.rows[0];
        res.status(200).json(post);
      } else {
        res.status(404).json({ message: 'Post not found' });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Update a post endpoint
app.put('/api/posts/:postId', async (req, res) => {
    const postId = req.params.postId;
    const { content } = req.body;
    try {
      const result = await pool.query('UPDATE posts SET message = $1 WHERE post_id = $2', [content, postId]);
      if (result.rowCount > 0) {
        res.status(200).json({ message: 'Post updated' });
      } else {
        res.status(404).json({ message: 'Post not found' });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Delete a post endpoint
  app.delete('/api/posts/:postId', async (req, res) => {
    const postId = req.params.postId;
    try {
      const result = await pool.query('DELETE FROM posts WHERE post_id = $1', [postId]);
      if (result.rowCount > 0) {
        res.status(200).json({ message: 'Post deleted' });
      } else {
        res.status(404).json({ message: 'Post not found' });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Get all direct messages for a user endpoint
  // probably needs to be reworked later
  app.get('/api/direct_messages/:userId', async (req, res) => {
    const userId = req.params.userId;
    try {
      const result = await pool.query('SELECT * FROM direct_messages WHERE sender_id = $1 OR recipient_id = $1 ORDER BY created_at DESC', [userId]);
      const directMessages = result.rows;
      res.status(200).json(directMessages);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  });

// Start the server
app.listen(3000, () => {
  console.log('Server started on port 3000');
});
