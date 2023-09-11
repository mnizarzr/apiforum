const CommentRepository = require('../../../Domains/comments/CommentRepository');
const ThreadRepository = require('../../../Domains/threads/ThreadRepository');
const DeleteReplyUseCase = require('../DeleteReplyUseCase');

describe('DeleteReplyUseCase', () => {
  it('should throw error when use case payload not contain needed payload', async () => {
    const useCasePayload = {
      threadId: 'thread-123',
      commentId: 'comment-123',
    };

    const deleteReplyUseCase = new DeleteReplyUseCase({});

    await expect(deleteReplyUseCase.execute(useCasePayload)).rejects.toThrowError(
      'DELETE_REPLY_USE_CASE.NOT_CONTAIN_NEEDED_PAYLOAD'
    );
  });

  it('should throw error when use case payload not meet data type specification', async () => {
    const useCasePayload = {
      threadId: 123,
      commentId: 456,
      owner: 789,
      replyId: 'reply-123',
    };

    const deleteReplyUseCase = new DeleteReplyUseCase({});

    await expect(deleteReplyUseCase.execute(useCasePayload)).rejects.toThrowError(
      'DELETE_REPLY_USE_CASE.PAYLOAD_NOT_MEET_DATA_TYPE_SPECIFICATION'
    );
  });

  it('should orchestrate the delete reply action properly', async () => {
    const useCasePayload = {
      threadId: 'thread-123',
      commentId: 'comment-123',
      replyId: 'reply-123',
      owner: 'user-123',
    };

    const mockThreadRepository = new ThreadRepository();
    const mockCommentRepository = new CommentRepository();

    mockThreadRepository.verifyAvailableThread = jest.fn(() => Promise.resolve());
    mockCommentRepository.verifyCommentOwner = jest.fn(() => Promise.resolve());
    mockCommentRepository.deleteReplyById = jest.fn(() => Promise.resolve());

    const deleteReplyUseCase = new DeleteReplyUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
    });

    await deleteReplyUseCase.execute(useCasePayload);

    expect(mockThreadRepository.verifyAvailableThread).toBeCalledWith(useCasePayload.threadId);
    expect(mockCommentRepository.verifyCommentOwner).toBeCalledWith(useCasePayload.replyId, useCasePayload.owner);
    expect(mockCommentRepository.deleteReplyById).toBeCalledWith(
      useCasePayload.threadId,
      useCasePayload.commentId,
      useCasePayload.replyId
    );
  });
});