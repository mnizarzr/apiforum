const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const NotFoundError = require('../../../Commons/exceptions/NotFoundError');
const NewThread = require('../../../Domains/threads/entities/NewThread');
const AddedThread = require('../../../Domains/threads/entities/AddedThread');
const pool = require('../../database/postgres/pool');
const ThreadRepositoryPostgres = require('../ThreadRepositoryPostgres');
const Thread = require('../../../Domains/threads/entities/Thread');

describe('ThreadRepositoryPostgres', () => {
  afterEach(async () => {
    await UsersTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('addThread method', () => {
    it('should persist new thread and return added thread correctly', async () => {
      // Ask for reviewer feedback:
      // Kalau sesuai materi di sini dipisah sendiri-sendiri new (assert length) dan added (assert return)
      // Di sini saya jadikan satu karena alasan dipisahnya saya belum nangkep kenapa?

      await UsersTableTestHelper.addUser({});

      const newThread = new NewThread({
        title: 'title lorem ipsum',
        body: 'body dolor sit amet',
        owner: 'user-123',
      });

      const fakeIdGenerator = () => 'abc123';
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, fakeIdGenerator);

      const thread = await threadRepositoryPostgres.addThread(newThread);

      const threads = await ThreadsTableTestHelper.findThreadById('thread-abc123');
      expect(threads).toHaveLength(1);
      expect(thread).toStrictEqual(
        new AddedThread({
          id: 'thread-abc123',
          title: newThread.title,
          owner: newThread.owner,
        })
      );
    });
  });

  describe('getThreadById method', () => {
    it('should throw NotFoundError when thread is not available', async () => {
      // Arrange
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool);

      // Action and Assert
      await expect(threadRepositoryPostgres.getThreadById('thread-abc789')).rejects.toThrowError(NotFoundError);
    });

    it('should return detailed thread when thread available', async () => {
      const newUser = {
        id: 'user-abc789',
        username: 'author1',
      };

      const newThread = {
        id: 'thread-abc789',
        title: 'Thread title lorem',
        body: 'Thread body dolor sit amet',
        date: new Date(),
        owner: newUser.id,
      };

      await UsersTableTestHelper.addUser(newUser);
      await ThreadsTableTestHelper.addThread(newThread);

      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, null);

      const thread = await threadRepositoryPostgres.getThreadById(newThread.id);
      expect(thread).toStrictEqual(
        new Thread({
          id: newThread.id,
          title: newThread.title,
          body: newThread.body,
          date: newThread.date,
          username: newUser.username,
          comments: [],
        })
      );
    });
  });

  describe('verifyAvailableThread method', () => {
    it('should throw NotFoundError when thread not available', async () => {
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool);

      await expect(threadRepositoryPostgres.verifyAvailableThread('thread-abc789')).rejects.toThrowError(NotFoundError);
    });

    it('should not throw NotFoundError when thread available', async () => {
      const newUser = {
        id: 'user-abc789',
      };

      const newThread = {
        id: 'thread-abc789',
        owner: newUser.id,
      };

      await UsersTableTestHelper.addUser(newUser);
      await ThreadsTableTestHelper.addThread(newThread);

      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool);

      await expect(threadRepositoryPostgres.verifyAvailableThread(newThread.id)).resolves.not.toThrowError(
        NotFoundError
      );
    });
  });
});
