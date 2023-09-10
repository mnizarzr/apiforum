const Comment = require('../Comment');

describe('a Comment entity', () => {
  it('should throw error when payload did not contain needed property', () => {
    // Arrange
    const payload = {
      id: 'comment-abc123',
      content: 'pertamax',
      username: 'commenter',
    };

    // Action and Assert
    expect(() => new Comment(payload)).toThrowError('COMMENT.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error when payload did not meet data type specification', () => {
    // Arrange
    const payload = {
      id: 'comment-abc123',
      content: 'pertamax',
      username: 123,
      date: '31/12/2023',
      replies: {},
      isDeleted: '2',
    };

    // Action and Assert
    expect(() => new Comment(payload)).toThrowError('COMMENT.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should create comment object correctly', () => {
    // Arrange
    const payload = {
      id: 'comment-abc123',
      content: 'pertamax',
      username: 'commenter',
      date: new Date(),
      replies: [],
      isDeleted: false,
    };

    // Action
    const comment = new Comment(payload);

    // Assert
    expect(comment.id).toEqual(payload.id);
    expect(comment.content).toEqual(payload.content);
    expect(comment.username).toEqual(payload.username);
    expect(comment.date).toEqual(payload.date);
    expect(comment.replies).toEqual(payload.replies);
  });

  it('should create deleted comment object correctly', () => {
    // Arrange
    const payload = {
      id: 'comment-abc123',
      content: 'pertamax',
      username: 'commenter',
      date: new Date(),
      replies: [],
      isDeleted: true,
    };

    // Action
    const deletedComment = new Comment(payload);

    // Assert
    expect(deletedComment.id).toEqual(payload.id);
    expect(deletedComment.content).toEqual('**komentar telah dihapus**');
    expect(deletedComment.username).toEqual(payload.username);
    expect(deletedComment.date).toEqual(payload.date);
    expect(deletedComment.replies).toEqual(payload.replies);
  });
});
