import { parseSQLQuery } from '../queryUtils';

describe(parseSQLQuery, () => {
  it('should detect SELECT queries as returning rows', () => {
    expect(parseSQLQuery('SELECT * FROM users').canReturnRows).toBe(true);
    expect(parseSQLQuery('select * from users').canReturnRows).toBe(true);
    expect(parseSQLQuery('  SELECT * FROM users  ').canReturnRows).toBe(true);
    expect(parseSQLQuery('SELECT id, name FROM users WHERE age > 21').canReturnRows).toBe(true);
  });

  it('should detect SELECT with subqueries as returning rows', () => {
    expect(parseSQLQuery('SELECT * FROM (SELECT * FROM users) AS u').canReturnRows).toBe(true);
  });

  it('should detect SELECT with JOIN as returning rows', () => {
    expect(
      parseSQLQuery('SELECT u.*, p.* FROM users u JOIN posts p ON u.id = p.user_id').canReturnRows
    ).toBe(true);
  });

  it('should detect INSERT queries as not returning rows', () => {
    expect(parseSQLQuery('INSERT INTO users (name) VALUES ("Alice")').canReturnRows).toBe(false);
    expect(parseSQLQuery('insert into users values (1, "Bob")').canReturnRows).toBe(false);
    expect(parseSQLQuery('  INSERT INTO users (name) VALUES ("Charlie")  ').canReturnRows).toBe(
      false
    );
  });

  it('should detect UPDATE queries as not returning rows', () => {
    expect(parseSQLQuery('UPDATE users SET name = "Alice" WHERE id = 1').canReturnRows).toBe(false);
    expect(parseSQLQuery('update users set age = 30').canReturnRows).toBe(false);
  });

  it('should detect DELETE queries as not returning rows', () => {
    expect(parseSQLQuery('DELETE FROM users WHERE id = 1').canReturnRows).toBe(false);
    expect(parseSQLQuery('delete from users').canReturnRows).toBe(false);
  });

  it('should detect INSERT with RETURNING as returning rows', () => {
    expect(
      parseSQLQuery('INSERT INTO users (name) VALUES ("Alice") RETURNING *').canReturnRows
    ).toBe(true);
    expect(
      parseSQLQuery('INSERT INTO users (name) VALUES ("Alice") RETURNING id').canReturnRows
    ).toBe(true);
  });

  it('should detect UPDATE with RETURNING as returning rows', () => {
    expect(
      parseSQLQuery('UPDATE users SET name = "Alice" WHERE id = 1 RETURNING *').canReturnRows
    ).toBe(true);
  });

  it('should detect DELETE with RETURNING as returning rows', () => {
    expect(parseSQLQuery('DELETE FROM users WHERE id = 1 RETURNING *').canReturnRows).toBe(true);
  });

  it('should detect PRAGMA queries as returning rows', () => {
    expect(parseSQLQuery('PRAGMA table_info(users)').canReturnRows).toBe(true);
    expect(parseSQLQuery('pragma user_version').canReturnRows).toBe(true);
  });

  it('should detect WITH queries as returning rows', () => {
    expect(parseSQLQuery('WITH cte AS (SELECT * FROM users) SELECT * FROM cte').canReturnRows).toBe(
      true
    );
    expect(parseSQLQuery('with cte as (select 1) select * from cte').canReturnRows).toBe(true);
  });

  it('should detect EXPLAIN queries as returning rows', () => {
    expect(parseSQLQuery('EXPLAIN SELECT * FROM users').canReturnRows).toBe(true);
    expect(parseSQLQuery('EXPLAIN QUERY PLAN SELECT * FROM users').canReturnRows).toBe(true);
    expect(parseSQLQuery('explain select * from users').canReturnRows).toBe(true);
  });

  it('should handle quoted strings containing keywords', () => {
    expect(parseSQLQuery('INSERT INTO users (name) VALUES ("SELECT")').canReturnRows).toBe(false);
    expect(parseSQLQuery("INSERT INTO users (name) VALUES ('SELECT')").canReturnRows).toBe(false);
    expect(parseSQLQuery('SELECT * FROM users WHERE name = "INSERT"').canReturnRows).toBe(true);
  });

  it('should handle double quotes in query', () => {
    expect(parseSQLQuery('SELECT * FROM users WHERE name = "Alice"').canReturnRows).toBe(true);
    expect(parseSQLQuery('INSERT INTO users (name) VALUES ("Bob")').canReturnRows).toBe(false);
  });

  it('should handle single quotes in query', () => {
    expect(parseSQLQuery("SELECT * FROM users WHERE name = 'Alice'").canReturnRows).toBe(true);
    expect(parseSQLQuery("INSERT INTO users (name) VALUES ('Bob')").canReturnRows).toBe(false);
  });

  it('should handle multi-line queries', () => {
    expect(
      parseSQLQuery(`
      SELECT *
      FROM users
      WHERE age > 21
    `).canReturnRows
    ).toBe(true);

    expect(
      parseSQLQuery(`
      INSERT INTO users (name, age)
      VALUES ("Alice", 30)
    `).canReturnRows
    ).toBe(false);
  });

  it('should detect CREATE queries as not returning rows', () => {
    expect(parseSQLQuery('CREATE TABLE users (id INTEGER PRIMARY KEY)').canReturnRows).toBe(false);
    expect(parseSQLQuery('CREATE INDEX idx_users ON users(name)').canReturnRows).toBe(false);
  });

  it('should detect ALTER queries as not returning rows', () => {
    expect(parseSQLQuery('ALTER TABLE users ADD COLUMN email TEXT').canReturnRows).toBe(false);
  });

  it('should detect DROP queries as not returning rows', () => {
    expect(parseSQLQuery('DROP TABLE users').canReturnRows).toBe(false);
    expect(parseSQLQuery('DROP INDEX idx_users').canReturnRows).toBe(false);
  });

  // Edge cases
  it('should handle queries with only whitespace', () => {
    expect(parseSQLQuery('   ').canReturnRows).toBe(false);
    expect(parseSQLQuery('\n\t\r').canReturnRows).toBe(false);
  });

  it('should handle empty queries', () => {
    expect(parseSQLQuery('').canReturnRows).toBe(false);
  });

  it('should handle queries with tabs and newlines', () => {
    expect(parseSQLQuery('SELECT\t*\nFROM\rusers').canReturnRows).toBe(true);
    expect(parseSQLQuery('INSERT\tINTO\nusers\rVALUES\t(1)').canReturnRows).toBe(false);
  });

  // Complex scenarios
  it('should prioritize RETURNING in backwards parsing', () => {
    // The parser parses backwards, so RETURNING should take precedence
    expect(parseSQLQuery('INSERT INTO users SELECT * FROM temp RETURNING *').canReturnRows).toBe(
      true
    );
  });

  it('should correctly detect INSERT...SELECT as mutation', () => {
    // Priority-based parsing correctly treats INSERT...SELECT as a mutation
    // INSERT takes precedence over SELECT in the priority order
    expect(parseSQLQuery('INSERT INTO users SELECT * FROM temp').canReturnRows).toBe(false);

    // However, if it has RETURNING, it returns rows
    expect(parseSQLQuery('INSERT INTO users SELECT * FROM temp RETURNING *').canReturnRows).toBe(
      true
    );
  });

  it('should handle semicolons at end', () => {
    expect(parseSQLQuery('SELECT * FROM users;').canReturnRows).toBe(true);
    expect(parseSQLQuery('INSERT INTO users VALUES (1);').canReturnRows).toBe(false);
  });

  it('should be case insensitive', () => {
    expect(parseSQLQuery('SeLeCt * FrOm users').canReturnRows).toBe(true);
    expect(parseSQLQuery('InSeRt InTo users VaLuEs (1)').canReturnRows).toBe(false);
  });
});
