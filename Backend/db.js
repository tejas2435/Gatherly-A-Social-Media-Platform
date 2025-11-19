import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'social_auth', // here enter your database name 
  password: '123456123', // here enter your password for pgadmin 

  port: 5432,
});

export default pool;

