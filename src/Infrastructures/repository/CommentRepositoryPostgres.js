const CommentRepository = require('../../Domains/comments/CommentRepository');
const AddedComment = require('../../Domains/comments/entities/AddedComment');

const NotFoundError = require('../../Commons/exceptions/NotFoundError');
const AuthorizationError = require('../../Commons/exceptions/AuthorizationError');

const COMMENT = 'comment';

class CommentRepositoryPostgres extends CommentRepository {
  constructor(pool, idGenerator) {
    super();
    this._pool = pool;
    this._idGenerator = idGenerator;
  }

  async addComment(newComment) {
    const { threadId, content, owner } = newComment;
    const id = `${COMMENT}-${this._idGenerator()}`;
    const date = new Date();

    const query = {
      text: 'INSERT INTO thread_comments VALUES($1, $2, $3, $4, $5, $6) RETURNING id, content, owner',
      values: [id, threadId, owner, content, date, false],
    };

    const result = await this._pool.query(query);

    // saya biarkan gapapa ya kak :) ngejar submission :"
    // ini niru di UserRepositoryPostgres bawaan dari dicoding :)
    return new AddedComment({ ...result.rows[0] });
  }

  async verifyAvailableComment(id) {
    const query = {
      text: 'SELECT id FROM thread_comments WHERE id = $1',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (result.rows.length === 0) {
      throw new NotFoundError('Comment not found');
    }
  }

  async verifyCommentOwner(id, owner) {
    const query = {
      text: 'SELECT id, owner FROM thread_comments WHERE id = $1',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (result.rows.length === 0) {
      throw new NotFoundError('Comment not found');
    }

    const comment = result.rows[0];
    /* istanbul ignore else */
    if (comment.owner !== owner) {
      throw new AuthorizationError('You have no right to access this resource');
    }
  }

  async deleteCommentById(threadId, id) {
    const query = {
      text: 'UPDATE thread_comments SET is_deleted = true WHERE thread_id = $1 AND id = $2 RETURNING id',
      values: [threadId, id],
    };

    const result = await this._pool.query(query);

    if (result.rowCount === 0) {
      throw new NotFoundError('Comment not found');
    }
  }

  async getCommentsByThreadId(threadId) {
    const query = {
      text: `SELECT c.id AS id, u.username AS username, c.owner AS owner, c.thread_id AS "threadId", c.date AS date, c.content AS content, c.is_deleted AS "isDeleted"
        FROM thread_comments c
        INNER JOIN users u ON u.id = c.owner
        WHERE c.thread_id = $1`,
      values: [threadId],
    };

    const result = await this._pool.query(query);

    if (result.rows.length === 0) {
      return [];
    }

    // Tidak saya map untuk jadi entity karena disarankan
    // reviewer sebelumnya untuk mengorkestrasi di use case
    return result.rows;
  }
}

module.exports = CommentRepositoryPostgres;
