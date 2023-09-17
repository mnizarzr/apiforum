const NewReply = require('../NewReply');

describe('a NewReply entity', () => {
  it('should throw error when payload did not contain needed property', () => {
    const payload = {
      threadId: 'thread-abc123',
      content: 'pertamax',
      owner: 'usre-abc123',
    };

    expect(() => new NewReply(payload)).toThrowError('NEW_REPLY.NOT_CONTAIN_NEEDED_PROPERTY');
  });
  it('should throw error when payload did not meet data type specification', () => {
    const payload = {
      threadId: 123,
      commentId: 456,
      content: {},
      owner: [],
    };

    expect(() => new NewReply(payload)).toThrowError('NEW_REPLY.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });
  it('should create newReply object correctly', () => {
    const payload = {
      threadId: 'thread-abc123',
      commentId: 'comment-abc123',
      content: 'pertamax',
      owner: 'user-abc123',
    };

    const newReply = new NewReply(payload);

    expect(newReply.threadId).toEqual(payload.threadId);
    expect(newReply.commentId).toEqual(payload.commentId);
    expect(newReply.content).toEqual(payload.content);
    expect(newReply.owner).toEqual(payload.owner);
  });
});
