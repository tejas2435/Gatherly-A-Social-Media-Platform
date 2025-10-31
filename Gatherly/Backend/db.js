import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: '     ', // enter your database name
  password: '     ', // enter your database password
  port: 5432,
});

export default pool;
