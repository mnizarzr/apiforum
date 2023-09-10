const NewComment = require('../NewComment');

describe('a NewComment entity', () => {
  it('should throw error when payload did not contain needed property', () => {
    const payload = {
      content: 'pertamax',
      owner: 'user-abc123',
    };

    expect(() => new NewComment(payload)).toThrowError('NEW_COMMENT.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error when payload did not meet data type specification', () => {
    const payload = {
      threadId: 123,
      content: [],
      owner: {},
    };

    expect(() => new NewComment(payload)).toThrowError('NEW_COMMENT.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should create newComment object correctly', () => {
    const payload = {
      threadId: 'thread-abc123',
      content: 'pertamax',
      owner: 'user-abc123',
    };

    const newComment = new NewComment(payload);

    expect(newComment.threadId).toEqual(payload.threadId);
    expect(newComment.content).toEqual(payload.content);
    expect(newComment.owner).toEqual(payload.owner);
  });
});
