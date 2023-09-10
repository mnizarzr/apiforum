const Thread = require('../Thread');

describe('a Thread entity', () => {
  it('should throw error when payload did not contain needed property', () => {
    // Arrange
    const payload = {
      id: 'thread-abc123',
      title: 'Title lorem ipsum',
      body: 'dolor sit amet',
    };

    // Action and Assert
    expect(() => new Thread(payload)).toThrowError('THREAD.NOT_CONTAIN_NEEDED_PROPERTY');
  });
  it('should throw error when payload did not meet data type specification', () => {
    // Arrange
    const payload = {
      id: 'thread-abc123',
      title: 123,
      body: true,
      date: '31/12/2023',
      username: 'developer',
      comments: {},
    };

    // Action and Assert
    expect(() => new Thread(payload)).toThrowError('THREAD.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });
  it('should create thread object correctly', () => {
    // Arrange
    const payload = {
      id: 'thread-abc123',
      title: 'Title lorem ipsum',
      body: 'dolor sit amet',
      date: new Date(),
      username: 'author1',
      comments: [],
    };

    // Action
    const thread = new Thread(payload);

    expect(thread.id).toEqual(payload.id);
    expect(thread.title).toEqual(payload.title);
    expect(thread.body).toEqual(payload.body);
    expect(thread.date).toEqual(payload.date);
    expect(thread.username).toEqual(payload.username);
    expect(thread.comments).toEqual(payload.comments);
  });
});
