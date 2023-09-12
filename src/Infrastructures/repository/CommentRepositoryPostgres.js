const CommentRepository = require('../../Domains/comments/CommentRepository');
const AddedComment = require('../../Domains/comments/entities/AddedComment');
const Comment = require('../../Domains/comments/entities/Comment');

const NotFoundError = require('../../Commons/exceptions/NotFoundError');
const AuthorizationError = require('../../Commons/exceptions/AuthorizationError');
const Reply = require('../../Domains/comments/entities/Reply');

const COMMENT = 'comment';
const REPLY = 'reply';

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
      text: 'INSERT INTO thread_comments VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING id, content, owner',
      values: [id, content, threadId, owner, null, date, false],
    };

    const result = await this._pool.query(query);

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

  async getCommentsWithRepliesByThreadId(threadId) {
    const query = {
      text: `SELECT c.id as id, u.username as username, c.date as date, c.content as content, c.parent_id as "parentId", c.is_deleted AS "isDeleted"
        FROM thread_comments c
        INNER JOIN users u ON u.id = c.owner
        WHERE c.thread_id = $1
        ORDER BY c.parent_id NULLS FIRST`,
      values: [threadId],
    };

    const result = await this._pool.query(query);

    if (result.rows.length === 0) {
      return [];
    }

    return this._groupRepliesIntoComment(result.rows);
  }

  _groupRepliesIntoComment(commentsOrReplies) {
    // how to test this
    const commentWithReplies = [];
    commentsOrReplies.forEach((row) => {
      if (!row.parentId) {
        commentWithReplies.push(
          new Comment({
            ...row,
            replies: [],
          })
        );
      } else {
        const parentCommentIdx = commentWithReplies.findIndex((comment) => comment.id === row.parentId);
        commentWithReplies[parentCommentIdx].replies.push(
          new Reply({
            ...row,
          })
        );
      }
    });

    return commentWithReplies;
  }

  async addReply(newReply) {
    const { threadId, commentId: parentId, content, owner } = newReply;
    const id = `${REPLY}-${this._idGenerator()}`;
    const date = new Date();

    const query = {
      text: 'INSERT INTO thread_comments VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING id, content, owner',
      values: [id, content, threadId, owner, parentId, date, false],
    };

    const result = await this._pool.query(query);

    return new AddedComment({ ...result.rows[0] });
  }

  async deleteReplyById(threadId, parentId, id) {
    const query = {
      text: 'UPDATE thread_comments SET is_deleted = true WHERE thread_id = $1 AND parent_id = $2 AND id = $3 RETURNING id',
      values: [threadId, parentId, id],
    };

    const result = await this._pool.query(query);

    if (result.rowCount === 0) {
      throw new NotFoundError('Reply not found');
    }
  }
}

module.exports = CommentRepositoryPostgres;
