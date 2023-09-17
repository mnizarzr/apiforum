const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const CommentsTableTestHelper = require('../../../../tests/CommentsTableTestHelper');

const pool = require('../../database/postgres/pool');

const NewComment = require('../../../Domains/comments/entities/NewComment');
const AddedComment = require('../../../Domains/comments/entities/AddedComment');

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

      await expect(commentRepositoryPostgres.verifyCommentOwner('comment-abc123', 'user-abc789')).rejects.toThrowError(
        AuthorizationError
      );
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

  describe('getCommentsByThreadId method', () => {
    it("should return empty array when thread don't have any comment", async () => {
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, null);

      await expect(commentRepositoryPostgres.getCommentsByThreadId('thread-abc123')).resolves.toEqual([]);
    });
    it("should return thread's comment when available", async () => {
      const ts = new Date();

      await CommentsTableTestHelper.addComment({
        id: 'comment-abc123',
        threadId: 'thread-abc123',
        owner: 'user-abc123',
        content: 'pertamax',
        date: ts,
      });

      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, null);

      const comments = await commentRepositoryPostgres.getCommentsByThreadId('thread-abc123');

      expect(comments).toMatchObject([
        {
          id: 'comment-abc123',
          threadId: 'thread-abc123',
          owner: 'user-abc123',
          content: 'pertamax',
          date: ts,
          isDeleted: false,
        },
      ]);
    });
  });
});
