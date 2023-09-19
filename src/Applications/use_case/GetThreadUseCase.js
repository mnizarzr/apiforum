const Thread = require('../../Domains/threads/entities/Thread');
const Comment = require('../../Domains/comments/entities/Comment');
const Reply = require('../../Domains/replies/entities/Reply');

class GetThreadUseCase {
  constructor({ threadRepository, commentRepository, replyRepository }) {
    this._threadRepository = threadRepository;
    this._commentRepository = commentRepository;
    this._replyRepository = replyRepository;
  }

  async execute(useCasePayload) {
    this._verifyPayload(useCasePayload);
    const thread = await this._threadRepository.getThreadById(useCasePayload.threadId);
    const comments = await this._commentRepository.getCommentsByThreadId(useCasePayload.threadId);
    const commentsWithReplies = [];

    if (comments.length > 0) {
      const commentIds = comments.map(comment => comment.id)
      const replies = await this._replyRepository.getRepliesByCommentIds(commentIds)

      const commentReplies = {};

      replies.forEach(reply => {

        /* istanbul ignore else */
        if (!commentReplies[reply.commentId]) {
          commentReplies[reply.commentId] = [];
        }

        commentReplies[reply.commentId].push(new Reply({ ...reply }));
      });

      comments.forEach(comment => {
        const repliesForComment = commentReplies[comment.id] || [];
        commentsWithReplies.push(new Comment({ ...comment, replies: repliesForComment }))
      });

    }

    return new Thread({ ...thread, comments: commentsWithReplies });
  }

  _verifyPayload({ threadId }) {
    if (!threadId) {
      throw new Error('GET_THREAD_USE_CASE.NOT_CONTAIN_THREAD_ID');
    }

    if (typeof threadId !== 'string') {
      throw new Error('GET_THREAD_USE_CASE.PAYLOAD_NOT_MEET_DATA_TYPE_SPECIFICATION');
    }
  }
}

module.exports = GetThreadUseCase;
