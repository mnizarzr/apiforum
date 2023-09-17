const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const CommentsTableTestHelper = require('../../../../tests/CommentsTableTestHelper');
const RepliesTableTestHelper = require('../../../../tests/RepliesTableTestHelper');

const AddedReply = require('../../../Domains/replies/entities/AddedReply');
const NewReply = require('../../../Domains/replies/entities/NewReply');

const pool = require('../../database/postgres/pool');

const ReplyRepositoryPostgres = require('../ReplyRepositoryPostgres');

const NotFoundError = require('../../../Commons/exceptions/NotFoundError');
const AuthorizationError = require('../../../Commons/exceptions/AuthorizationError');

describe('ReplyRepositoryPostgres', () => {
  beforeAll(async () => {
    await UsersTableTestHelper.addUser({
      id: 'user-abc123',
      username: 'commenter1',
    });
    await UsersTableTestHelper.addUser({
      id: 'user-abc789',
      username: 'replier1',
    });
    await ThreadsTableTestHelper.addThread({
      id: 'thread-abc123',
      title: '(Test) Title thread for comment',
      body: '(Test) Body thread for comment',
      owner: 'user-abc123',
    });
    await CommentsTableTestHelper.addComment({
      id: 'comment-abc123',
      content: 'pertamax',
      threadId: 'thread-abc123',
      owner: 'user-abc123',
    });
  });

  afterAll(async () => {
    await UsersTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await CommentsTableTestHelper.cleanTable();
    await pool.end();
  });

  afterEach(async () => {
    await RepliesTableTestHelper.cleanTable();
  });

  describe('addReply method', () => {
    it('should persist new reply and return added reply properly', async () => {
      await CommentsTableTestHelper.addComment({
        id: 'comment-abc789',
        threadId: 'thread-abc123',
        owner: 'user-abc789',
      });

      const newReply = new NewReply({
        threadId: 'thread-abc123',
        commentId: 'comment-abc789',
        content: 'kedua',
        owner: 'user-abc789',
      });

      const fakeIdGenerator = () => 'abc123';
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, fakeIdGenerator);

      const addedReply = await replyRepositoryPostgres.addReply(newReply);

      const replies = await RepliesTableTestHelper.findRepliesById('reply-abc123');

      expect(replies).toHaveLength(1);
      expect(addedReply).toStrictEqual(
        new AddedReply({
          id: 'reply-abc123',
          content: newReply.content,
          owner: newReply.owner,
        })
      );
    });
  });
  describe('verifyAvailableReply method', () => {
    it('should throw NotFoundError when requested reply not available', async () => {
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, null);

      await expect(replyRepositoryPostgres.verifyAvailableReply('reply-xyz789')).rejects.toThrowError(NotFoundError);
    });

    it('should not throw NotFoundError when requested reply is available', async () => {
      await RepliesTableTestHelper.addReply({
        id: 'reply-abc123',
      });

      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, null);

      await expect(replyRepositoryPostgres.verifyAvailableReply('reply-abc123')).resolves.not.toThrowError(
        NotFoundError
      );
    });
  });

  describe('verifyReplyOwner method', () => {
    it('should throw NotFoundError when reply is not available', async () => {
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, null);

      await expect(replyRepositoryPostgres.verifyReplyOwner('reply-123', 'user-123')).rejects.toThrowError(
        NotFoundError
      );
    });

    it('should throw AuthorizationError when reply is not owned by user', async () => {
      await RepliesTableTestHelper.addReply({
        id: 'reply-abc123',
      });

      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, null);

      await expect(replyRepositoryPostgres.verifyReplyOwner('reply-abc123', 'user-abc789')).rejects.toThrowError(
        AuthorizationError
      );
    });

    it('should not throw AuthorizationError when reply is available', async () => {
      await RepliesTableTestHelper.addReply({
        id: 'comment-abc123',
        owner: 'user-abc123',
      });
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, null);

      await expect(
        replyRepositoryPostgres.verifyAvailableReply('comment-abc123', 'user-abc123')
      ).resolves.not.toThrowError(AuthorizationError);
    });
  });

  describe('getRepliesByCommentId method', () => {
    it("should return empty array when comment don't have any reply", async () => {
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, null);

      await expect(replyRepositoryPostgres.getRepliesByCommentId('comment-abc123')).resolves.toEqual([]);
    });
    it("should return comment's reply when available", async () => {
      const ts = new Date();

      await RepliesTableTestHelper.addReply({
        id: 'reply-abc123',
        commentId: 'comment-abc123',
        threadId: 'thread-abc123',
        owner: 'user-abc123',
        content: 'keduax',
        date: ts,
        isDeleted: false,
      });

      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, null);

      const replies = await replyRepositoryPostgres.getRepliesByCommentId('comment-abc123');

      // text: id, content, date, username, "isDeleted"
      expect(replies).toMatchObject([
        {
          id: 'reply-abc123',
          content: 'keduax',
          date: ts,
          isDeleted: false,
        },
      ]);
    });
  });

  describe('deleteReplyById method', () => {
    it('should throw NotFoundError when reply is not available', async () => {
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, null);

      await expect(
        replyRepositoryPostgres.deleteReplyById('thread-xyz789', 'comment-xyz789', 'reply-xyz789')
      ).rejects.toThrowError(NotFoundError);
    });

    it('should soft delete the reply from the storage properly', async () => {
      await RepliesTableTestHelper.addReply({
        id: 'reply-abc123',
        threadId: 'thread-abc123',
        commentId: 'comment-abc123',
      });

      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, null);

      await replyRepositoryPostgres.deleteReplyById('thread-abc123', 'comment-abc123', 'reply-abc123');

      const replies = await RepliesTableTestHelper.findRepliesById('reply-abc123');

      expect(replies[0].is_deleted).toEqual(true);
    });
  });
});
