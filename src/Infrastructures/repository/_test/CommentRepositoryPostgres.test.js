const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const CommentsTableTestHelper = require('../../../../tests/CommentsTableTestHelper');

const pool = require('../../database/postgres/pool');

const NewComment = require('../../../Domains/comments/entities/NewComment');
const AddedComment = require('../../../Domains/comments/entities/AddedComment');
const Comment = require('../../../Domains/comments/entities/Comment');
const NewReply = require('../../../Domains/comments/entities/NewReply');
const Reply = require('../../../Domains/comments/entities/Reply');

const CommentRepositoryPostgres = require('../CommentRepositoryPostgres');

const NotFoundError = require('../../../Commons/exceptions/NotFoundError');
const AuthorizationError = require('../../../Commons/exceptions/AuthorizationError');

describe('CommentRepositoryPostgres', () => {
  beforeAll(async () => {
    await UsersTableTestHelper.addUser({
      id: 'user-abc123',
      username: 'commenter1',
    });
    await UsersTableTestHelper.addUser({
      id: 'user-abc789',
      username: 'commenter2',
    });
    await ThreadsTableTestHelper.addThread({
      id: 'thread-abc123',
      title: '(Test) Title thread for comment',
      body: '(Test) Body thread for comment',
      owner: 'user-abc123',
    });
  });

  afterAll(async () => {
    await UsersTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await pool.end();
  });

  afterEach(async () => {
    await CommentsTableTestHelper.cleanTable();
  });

  describe('addComment method', () => {
    it('should persist new comment and return added comment properly', async () => {
      const newComment = new NewComment({
        threadId: 'thread-abc123',
        content: 'pertamax gan',
        owner: 'user-abc123',
      });

      const fakeIdGenerator = () => 'abc123';
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, fakeIdGenerator);

      const addedComment = await commentRepositoryPostgres.addComment(newComment);

      const comments = await CommentsTableTestHelper.findCommentsById('comment-abc123');

      expect(comments).toHaveLength(1);
      expect(addedComment).toStrictEqual(
        new AddedComment({
          id: 'comment-abc123',
          content: newComment.content,
          owner: newComment.owner,
        })
      );
    });
  });

  describe('verifyAvailableComment method', () => {
    it('should throw NotFoundError when requested comment not available', async () => {
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, null);

      await expect(commentRepositoryPostgres.verifyAvailableComment('comment-123')).rejects.toThrowError(NotFoundError);
    });

    it('should not throw NotFoundError when requested comment is available', async () => {
      await CommentsTableTestHelper.addComment({
        id: 'comment-abc123',
      });

      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, null);

      await expect(commentRepositoryPostgres.verifyAvailableComment('comment-abc123')).resolves.not.toThrowError(
        NotFoundError
      );
    });
  });

  describe('verifyCommentOwner method', () => {
    it('should throw NotFoundError when comment or reply is not available', async () => {
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, null);

      await expect(commentRepositoryPostgres.verifyCommentOwner('comment-123', 'user-123')).rejects.toThrowError(
        NotFoundError
      );
    });

    it('should throw AuthorizationError when comment or reply is not owned by user', async () => {
      await CommentsTableTestHelper.addComment({
        id: 'comment-abc123',
      });

      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, null);

      await expect(
        commentRepositoryPostgres.verifyCommentOwner('comment-abc123', 'user-abc789')
      ).rejects.toThrowError(AuthorizationError);
    });

    it('should not throw AuthorizationError when comment or reply is available', async () => {
      await CommentsTableTestHelper.addComment({
        id: 'comment-abc123',
        owner: 'user-abc123',
      });
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, null);

      await expect(
        commentRepositoryPostgres.verifyAvailableComment('comment-abc123', 'user-abc123')
      ).resolves.not.toThrowError(AuthorizationError);
    });
  });

  describe('deleteCommentById method', () => {
    it('should throw NotFoundError when comment is not available', async () => {
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, null);

      await expect(commentRepositoryPostgres.deleteCommentById('thread-xyz789', 'comment-xyz789')).rejects.toThrowError(
        NotFoundError
      );
    });

    it('should soft delete the comment from the storage properly', async () => {
      await CommentsTableTestHelper.addComment({
        id: 'comment-abc123',
        threadId: 'thread-abc123',
      });

      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, null);

      await commentRepositoryPostgres.deleteCommentById('thread-abc123', 'comment-abc123');

      const comments = await CommentsTableTestHelper.findCommentsById('comment-abc123');

      expect(comments[0].is_deleted).toEqual(true);
    });
  });

  describe('getCommentsWithRepliesByThreadId method', () => {
    it("should return empty array when thread don't have any comment", async () => {
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, null);

      await expect(commentRepositoryPostgres.getCommentsWithRepliesByThreadId('thread-abc123')).resolves.toEqual([]);
    });

    it("should return thread's comments and replies when available", async () => {
      const ts1 = new Date();
      ts1.setMinutes(1, 1);
      const ts2 = new Date();
      ts2.setMinutes(1, 2);
      const ts3 = new Date();
      ts3.setMinutes(2);
      const ts4 = new Date();
      ts4.setMinutes(3);

      await CommentsTableTestHelper.addComment({
        id: 'comment-abc123',
        threadId: 'thread-abc123',
        owner: 'user-abc123',
        date: ts1,
      });

      await CommentsTableTestHelper.addComment({
        id: 'comment-abc456',
        threadId: 'thread-abc123',
        owner: 'user-abc123',
        content: 'keduax',
        date: ts2,
        isDeleted: true,
      });

      await CommentsTableTestHelper.addComment({
        id: 'reply-123',
        threadId: 'thread-abc123',
        owner: 'user-abc789',
        content: 'udahgan',
        parentId: 'comment-abc456',
        date: ts3,
      });

      await CommentsTableTestHelper.addComment({
        id: 'reply-456',
        threadId: 'thread-abc123',
        owner: 'user-abc123',
        parentId: 'comment-abc456',
        content: 'okok',
        date: ts4,
        isDeleted: true,
      });

      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, null);

      const commentsWithReplies = await commentRepositoryPostgres.getCommentsWithRepliesByThreadId('thread-abc123');

      expect(commentsWithReplies).toStrictEqual([
        new Comment({
          id: 'comment-abc123',
          content: 'pertamax',
          username: 'commenter1',
          date: ts1,
          replies: [],
          isDeleted: false,
        }),
        new Comment({
          id: 'comment-abc456',
          content: '**komentar telah dihapus**',
          username: 'commenter1',
          date: ts2,
          replies: [
            new Reply({
              id: 'reply-123',
              content: 'udahgan',
              date: ts3,
              username: 'commenter2',
              isDeleted: false,
            }),
            new Reply({
              id: 'reply-456',
              content: '**balasan telah dihapus**',
              date: ts4,
              username: 'commenter1',
              isDeleted: true,
            }),
          ],
          isDeleted: true,
        }),
      ]);
    });
  });

  describe('addReply method', () => {
    it('should persist new reply and return added reply properly', async () => {
      await CommentsTableTestHelper.addComment({
        id: 'comment-abc123',
        threadId: 'thread-abc123',
        owner: 'user-abc123',
      });

      const newReply = new NewReply({
        threadId: 'thread-abc123',
        commentId: 'comment-abc123',
        content: 'kedua',
        owner: 'user-abc789',
      });

      const fakeIdGenerator = () => 'abc123';
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, fakeIdGenerator);

      const addedReply = await commentRepositoryPostgres.addReply(newReply);

      const comments = await CommentsTableTestHelper.findCommentsById('reply-abc123');

      expect(comments).toHaveLength(1);
      expect(addedReply).toStrictEqual(
        new AddedComment({
          id: 'reply-abc123',
          content: newReply.content,
          owner: newReply.owner,
        })
      );
    });
  });

  describe('deleteReplyById method', () => {
    it('should throw NotFoundError when reply is not available', async () => {
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, null);

      await expect(
        commentRepositoryPostgres.deleteReplyById('thread-xyz789', 'comment-xyz789', 'reply-xyz789')
      ).rejects.toThrowError(NotFoundError);
    });

    it('should soft delete the reply from the storage properly', async () => {
      await CommentsTableTestHelper.addComment({
        id: 'comment-abc123',
        threadId: 'thread-abc123',
      });
      await CommentsTableTestHelper.addComment({
        id: 'reply-abc123',
        threadId: 'thread-abc123',
        parentId: 'comment-abc123',
      });

      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, null);

      await commentRepositoryPostgres.deleteReplyById('thread-abc123', 'comment-abc123', 'reply-abc123');

      const comments = await CommentsTableTestHelper.findCommentsById('reply-abc123');

      expect(comments[0].is_deleted).toEqual(true);
    });
  });
});
