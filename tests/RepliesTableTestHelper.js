/* istanbul ignore file */
const pool = require('../src/Infrastructures/database/postgres/pool');

const RepliesTableTestHelper = {
  async addReply({
    id = 'reply-abc123',
    commentId = 'comment-abc123',
    threadId = 'thread-abc123',
    owner = 'user-abc123',
    content = 'keduax',
    date = new Date(),
    isDeleted = false,
  }) {
    const query = {
      text: 'INSERT INTO thread_comment_replies VALUES($1, $2, $3, $4, $5, $6, $7)',
      values: [id, commentId, threadId, owner, content, date, isDeleted],
    };

    await pool.query(query);
  },

  async findRepliesById(id) {
    const query = {
      text: 'SELECT * FROM thread_comment_replies WHERE id = $1',
      values: [id],
    };

    const result = await pool.query(query);
    return result.rows;
  },

  async cleanTable() {
    await pool.query('DELETE FROM thread_comment_replies WHERE 1=1');
  }
};

module.exports = RepliesTableTestHelper;
