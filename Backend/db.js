import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'social_auth',
  // password: 'Dhyana@123',
  // password: 'qwerty',
  password: '123456123',

  port: 5432,
});

export default pool;
