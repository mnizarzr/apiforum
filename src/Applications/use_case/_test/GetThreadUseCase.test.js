const Thread = require('../../../Domains/threads/entities/Thread');
const Comment = require('../../../Domains/comments/entities/Comment');
const Reply = require('../../../Domains/replies/entities/Reply');
const ThreadRepository = require('../../../Domains/threads/ThreadRepository');
const CommentRepository = require('../../../Domains/comments/CommentRepository');
const ReplyRepository = require('../../../Domains/replies/ReplyRepository');
const GetThreadUseCase = require('../GetThreadUseCase');

describe('GetThreadUseCase', () => {
  it('should throw error when use case payload not contain threadId', async () => {
    const useCasePayload = {};
    const getThreadUseCase = new GetThreadUseCase({});

    await expect(getThreadUseCase.execute(useCasePayload)).rejects.toThrowError(
      'GET_THREAD_USE_CASE.NOT_CONTAIN_THREAD_ID'
    );
  });

  it('should throw error when threadId not meet data type specification', async () => {
    const useCasePayload = {
      threadId: 123,
    };

    const getThreadUseCase = new GetThreadUseCase(useCasePayload);

    await expect(getThreadUseCase.execute(useCasePayload)).rejects.toThrowError(
      'GET_THREAD_USE_CASE.PAYLOAD_NOT_MEET_DATA_TYPE_SPECIFICATION'
    );
  });

  it('should orchestrating the get thread action properly', async () => {
    const ts = new Date();

    const useCasePayload = {
      threadId: 'thread-abc123',
    };

    // id, content, date, username, isDeleted
    const mockedReplies = [
      {
        id: 'reply-123',
        threadId: useCasePayload.threadId,
        commentId: 'comment-abc123',
        content: 'kedua',
        date: ts,
        username: 'commenter2',
        isDeleted: false,
      },
    ];

    // id, content, username, date, replies, isDeleted
    const mockedComments = [
      {
        id: 'comment-abc123',
        threadId: useCasePayload.threadId,
        content: 'pertamax',
        username: 'commenter1',
        date: ts,
        replies: [],
        isDeleted: false,
      },
      {
        id: 'comment-abc456',
        threadId: useCasePayload.threadId,
        content: 'kedua',
        username: 'commenter2',
        date: ts,
        replies: [],
        isDeleted: false,
      },
    ];

    const mockedThread = {
      id: useCasePayload.threadId,
      title: 'thread lorem ipsum',
      body: 'dolor sit amet',
      date: ts,
      username: 'author',
      comments: [],
    };

    const expectedThread = new Thread({
      id: useCasePayload.threadId,
      title: 'thread lorem ipsum',
      body: 'dolor sit amet',
      date: ts,
      username: 'author',
      comments: [
        new Comment({
          id: 'comment-abc123',
          content: 'pertamax',
          username: 'commenter1',
          date: ts,
          replies: [
            new Reply({
              id: 'reply-123',
              content: 'kedua',
              date: ts,
              username: 'commenter2',
              isDeleted: false,
            }),
          ],
          isDeleted: false,
        }),
        new Comment({
          id: 'comment-abc456',
          content: 'kedua',
          username: 'commenter2',
          date: ts,
          replies: [],
          isDeleted: false,
        }),
      ],
    });

    const mockThreadRepository = new ThreadRepository();
    const mockCommentRepository = new CommentRepository();
    const mockReplyRepository = new ReplyRepository();

    mockThreadRepository.getThreadById = jest.fn(() => Promise.resolve(mockedThread));
    mockCommentRepository.getCommentsByThreadId = jest.fn(() => Promise.resolve(mockedComments));
    mockReplyRepository.getRepliesByCommentIds = jest.fn(() => Promise.resolve(mockedReplies));

    const getThreadUseCase = new GetThreadUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
      replyRepository: mockReplyRepository,
    });

    // getThreadUseCase._setRepliesIntoComment = jest.fn(()=> Promise.resolve([{...mockedComments, replies: mockedReplies}, {...mockedComments[1]}]))

    const thread = await getThreadUseCase.execute(useCasePayload);

    expect(thread).toStrictEqual(expectedThread);
    expect(mockThreadRepository.getThreadById).toBeCalledWith(useCasePayload.threadId);
    expect(mockCommentRepository.getCommentsByThreadId).toBeCalledWith(useCasePayload.threadId);
    expect(mockReplyRepository.getRepliesByCommentIds).toBeCalledWith(['comment-abc123', 'comment-abc456'])
  });
});
