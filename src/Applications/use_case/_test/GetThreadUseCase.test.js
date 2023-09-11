const Thread = require('../../../Domains/threads/entities/Thread');
const Comment = require('../../../Domains/comments/entities/Comment');
const Reply = require('../../../Domains/comments/entities/Reply');
const ThreadRepository = require('../../../Domains/threads/ThreadRepository');
const CommentRepository = require('../../../Domains/comments/CommentRepository');
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
    const useCasePayload = {
      threadId: 'thread-abc123',
    };

    const mockedReplies = [
      new Reply({
        id: 'reply-123',
        content: 'kedua',
        date: new Date(),
        username: 'commenter2',
        isDeleted: false,
      }),
    ];

    const mockedComments = [
      new Comment({
        id: 'user-abc123',
        content: 'pertamax',
        username: 'commenter1',
        date: new Date(),
        replies: mockedReplies,
        isDeleted: false,
      }),
      new Comment({
        id: 'user-abc456',
        content: 'kedua',
        username: 'commenter2',
        date: new Date(),
        replies: [],
        isDeleted: false,
      }),
    ];

    const mockedThread = new Thread({
      id: useCasePayload.threadId,
      title: 'thread lorem ipsum',
      body: 'dolor sit amet',
      date: new Date(),
      username: 'author',
      comments: [],
    });

    const mockThreadRepository = new ThreadRepository();
    const mockCommentRepository = new CommentRepository();

    mockThreadRepository.getThreadById = jest.fn(() => Promise.resolve(mockedThread));
    mockCommentRepository.getCommentsWithRepliesByThreadId = jest.fn(() => Promise.resolve(mockedComments));

    const getThreadUseCase = new GetThreadUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
    });

    const thread = await getThreadUseCase.execute(useCasePayload);

    expect(thread).toStrictEqual(new Thread({ ...mockedThread, mockedComments }));
    expect(mockThreadRepository.getThreadById).toBeCalledWith(useCasePayload.threadId);
    expect(mockCommentRepository.getCommentsWithRepliesByThreadId).toBeCalledWith(useCasePayload.threadId);
  });
});
