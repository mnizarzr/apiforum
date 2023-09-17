const routes = (handler) => [
  {
    method: 'POST',
    path: '/threads/{threadId}/comments/{commentId}/replies',
    handler: handler.postThreadReplyHandler,
    options: {
      auth: 'jwt_strategy',
    },
  },
  {
    method: 'DELETE',
    path: '/threads/{threadId}/comments/{commentId}/replies/{replyId}',
    handler: handler.deleteThreadReplyByIdHandler,
    options: {
      auth: 'jwt_strategy',
    },
  },
];

module.exports = routes;
