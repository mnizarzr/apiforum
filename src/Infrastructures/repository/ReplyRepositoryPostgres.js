const ReplyRepository = require('../../Domains/replies/ReplyRepository');
const AddedReply = require('../../Domains/replies/entities/AddedReply');
const NotFoundError = require('../../Commons/exceptions/NotFoundError');
const AuthorizationError = require('../../Commons/exceptions/AuthorizationError');

const REPLY = 'reply';

class ReplyRepositoryPostgres extends ReplyRepository {
  constructor(pool, idGenerator) {
    super();
    this._pool = pool;
    this._idGenerator = idGenerator;
  }

  async addReply(newReply) {
    const { threadId, commentId, content, owner } = newReply;
    const id = `${REPLY}-${this._idGenerator()}`;
    const date = new Date();

    const query = {
      text: 'INSERT INTO thread_comment_replies VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING id, content, owner',
      values: [id, commentId, threadId, owner, content, date, false],
    };

    const result = await this._pool.query(query);

    return new AddedReply({ ...result.rows[0] });
  }

  async verifyAvailableReply(id) {
    const query = {
      text: 'SELECT id FROM thread_comment_replies WHERE id = $1',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (result.rows.length === 0) {
      throw new NotFoundError('Comment not found');
    }
  }

  async verifyReplyOwner(id, owner) {
    const query = {
      text: 'SELECT id, owner FROM thread_comment_replies WHERE id = $1',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (result.rows.length === 0) {
      throw new NotFoundError('Comment not found');
    }

    const reply = result.rows[0];
    /* istanbul ignore else */
    if (reply.owner !== owner) {
      throw new AuthorizationError('You have no right to access this resource');
    }
  }

  async getRepliesByCommentId(commentId) {
    const query = {
      text: `SELECT r.id AS id, r.content AS content, r.date AS date, u.username AS username, r.is_deleted AS "isDeleted"
      FROM thread_comment_replies r
      INNER JOIN users u ON u.id = r.owner
      WHERE r.comment_id = $1`,
      values: [commentId],
    };

    const result = await this._pool.query(query);

    if (result.rows.length === 0) {
      return [];
    }

    return result.rows;
  }

  async deleteReplyById(threadId, commentId, id) {
    const query = {
      text: 'UPDATE thread_comment_replies SET is_deleted = true WHERE thread_id = $1 AND comment_id = $2 AND id = $3 RETURNING id',
      values: [threadId, commentId, id],
    };

    const result = await this._pool.query(query);

    if (result.rowCount === 0) {
      throw new NotFoundError('Comment not found');
    }
  }
}

module.exports = ReplyRepositoryPostgres
