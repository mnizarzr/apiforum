const AuthenticationsTableTestHelper = require('../../../../tests/AuthenticationsTableTestHelper');
const CommentsTableTestHelper = require('../../../../tests/CommentsTableTestHelper');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const container = require('../../container');
const pool = require('../../database/postgres/pool');
const createServer = require('../createServer');

describe('/threads/{threadId}/comments endpoint', () => {
  beforeAll(async () => {
    // Prerequisites user and thread

    const server = await createServer(container);
    const userResponse = await server.inject({
      method: 'POST',
      url: '/users',
      payload: {
        username: 'dicoding',
        password: 'secret',
        fullname: 'Dicoding Indonesia',
      },
    });

    const userResponseJson = JSON.parse(userResponse.payload);

    await ThreadsTableTestHelper.addThread({
      id: 'thread-abc123',
      owner: userResponseJson.data.addedUser.id,
    });
  });

  afterAll(async () => {
    await AuthenticationsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await pool.end();
  });

  afterEach(async () => {
    await CommentsTableTestHelper.cleanTable();
  });

  describe('POST /threads/{threadId}/comments', () => {
    it('should response 201 and persisted new comment', async () => {
      const requestPayload = {
        content: 'Great thread you wrote',
      };

      const server = await createServer(container);

      const authResponse = await server.inject({
        method: 'POST',
        url: '/authentications',
        payload: {
          username: 'dicoding',
          password: 'secret',
        },
      });

      const { data: authData } = JSON.parse(authResponse.payload);

      const response = await server.inject({
        method: 'POST',
        url: '/threads/thread-abc123/comments',
        payload: requestPayload,
        headers: { authorization: `Bearer ${authData.accessToken}` },
      });

      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(201);
      expect(responseJson.status).toEqual('success');
      expect(responseJson.data.addedComment).toBeDefined();
    });

    it('should response 404 when thread is not found', async () => {
      const requestPayload = {
        content: 'Great thread you wrote',
      };

      const server = await createServer(container);

      const authResponse = await server.inject({
        method: 'POST',
        url: '/authentications',
        payload: {
          username: 'dicoding',
          password: 'secret',
        },
      });

      const { data: authData } = JSON.parse(authResponse.payload);

      const response = await server.inject({
        method: 'POST',
        url: '/threads/thread-xyz789/comments',
        payload: requestPayload,
        headers: { authorization: `Bearer ${authData.accessToken}` },
      });

      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(404);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toEqual('Thread not found');
    });

    it('should response 400 when request payload not contain needed property', async () => {
      const server = await createServer(container);

      const authResponse = await server.inject({
        method: 'POST',
        url: '/authentications',
        payload: {
          username: 'dicoding',
          password: 'secret',
        },
      });

      const { data: authData } = JSON.parse(authResponse.payload);

      const response = await server.inject({
        method: 'POST',
        url: '/threads/thread-abc123/comments',
        headers: { authorization: `Bearer ${authData.accessToken}` },
      });

      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(400);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toEqual('Failed to create comment, must contain all needed property');
    });

    it('should response 400 when request payload not meet data type specification', async () => {
      const requestPayload = {
        content: ['<bold>Great thread you wrote</bold>', '<br>'],
      };

      const server = await createServer(container);

      const authResponse = await server.inject({
        method: 'POST',
        url: '/authentications',
        payload: {
          username: 'dicoding',
          password: 'secret',
        },
      });

      const { data: authData } = JSON.parse(authResponse.payload);

      const response = await server.inject({
        method: 'POST',
        url: '/threads/thread-abc123/comments',
        payload: requestPayload,
        headers: { authorization: `Bearer ${authData.accessToken}` },
      });

      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(400);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toEqual("Failed to create comment, some property don't meet data type specs");
    });

    it('should response 401 when headers not contain Authorization Bearer accessToken', async () => {
      const requestPayload = {
        content: 'Great thread you wrote',
      };

      const server = await createServer(container);

      const response = await server.inject({
        method: 'POST',
        url: '/threads/thread-abc123/comments',
        payload: requestPayload,
      });

      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(401);
      expect(responseJson.message).toEqual('Missing authentication');
    });
  });

  describe('DELETE /threads/{threadId}/comments/{commentId}', () => {
    it('should response 200 if comment soft-deleted successfully', async () => {
      const requestPayload = {
        content: 'Great thread you wrote',
      };

      const server = await createServer(container);

      const authResponse = await server.inject({
        method: 'POST',
        url: '/authentications',
        payload: {
          username: 'dicoding',
          password: 'secret',
        },
      });

      const { data: authData } = JSON.parse(authResponse.payload);

      const postCommentResponse = await server.inject({
        method: 'POST',
        url: '/threads/thread-abc123/comments',
        payload: requestPayload,
        headers: { authorization: `Bearer ${authData.accessToken}` },
      });

      const { data: commentData } = JSON.parse(postCommentResponse.payload);

      const response = await server.inject({
        method: 'DELETE',
        url: `/threads/thread-abc123/comments/${commentData.addedComment.id}`,
        headers: { authorization: `Bearer ${authData.accessToken}` },
      });

      const responseJson = JSON.parse(response.payload);
      const [deletedComment] = await CommentsTableTestHelper.findCommentsById(commentData.addedComment.id);

      expect(response.statusCode).toEqual(200);
      expect(responseJson.status).toEqual('success');
      expect(deletedComment.is_deleted).toEqual(true);
    });

    it('should response 404 when threadId not available', async () => {
      const server = await createServer(container);

      const authResponse = await server.inject({
        method: 'POST',
        url: '/authentications',
        payload: {
          username: 'dicoding',
          password: 'secret',
        },
      });

      const { data: authData } = JSON.parse(authResponse.payload);

      const response = await server.inject({
        method: 'DELETE',
        url: '/threads/thread-xyz456/comments/comment-xyz456',
        headers: { authorization: `Bearer ${authData.accessToken}` },
      });

      const responseJson = JSON.parse(response.payload);

      expect(response.statusCode).toEqual(404);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toEqual('Thread not found');
    });

    it('should response 404 when commentId not available', async () => {
      const server = await createServer(container);

      const authResponse = await server.inject({
        method: 'POST',
        url: '/authentications',
        payload: {
          username: 'dicoding',
          password: 'secret',
        },
      });

      const { data: authData } = JSON.parse(authResponse.payload);

      const response = await server.inject({
        method: 'DELETE',
        url: '/threads/thread-abc123/comments/comment-xyz456',
        headers: { authorization: `Bearer ${authData.accessToken}` },
      });

      const responseJson = JSON.parse(response.payload);

      expect(response.statusCode).toEqual(404);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toEqual('Comment not found');
    });

    it('should response 403 when resource is forbidden', async () => {
      const server = await createServer(container);

      await UsersTableTestHelper.addUser({ id: 'user-xyz789', username: 'commenter10' });
      await CommentsTableTestHelper.addComment({
        id: 'comment-xyz789',
        threadId: 'thread-abc123',
        owner: 'user-xyz789',
      });

      const authResponse = await server.inject({
        method: 'POST',
        url: '/authentications',
        payload: {
          username: 'dicoding',
          password: 'secret',
        },
      });

      const { data: authData } = JSON.parse(authResponse.payload);

      const response = await server.inject({
        method: 'DELETE',
        url: '/threads/thread-abc123/comments/comment-xyz789',
        headers: { authorization: `Bearer ${authData.accessToken}` },
      });

      const responseJson = JSON.parse(response.payload);

      expect(response.statusCode).toEqual(403);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toEqual('You have no right to access this resource');
    });
  });
});
