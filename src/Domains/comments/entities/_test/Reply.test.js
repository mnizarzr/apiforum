const Reply = require('../Reply');

describe('a Reply entity', () => {
  it('should throw error when payload did not contain needed property', () => {
    const payload = {
      id: 'reply-abc123',
      username: 'replier',
    };

    expect(() => new Reply(payload)).toThrowError('REPLY.NOT_CONTAIN_NEEDED_PROPERTY');
  });
  it('should throw error when payload did not meet data type specification', () => {
    const payload = {
      id: 123,
      content: {},
      date: '31/12/2023',
      username: [],
      isDeleted: 'maybe',
    };

    expect(() => new Reply(payload)).toThrowError('REPLY.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });
  it('should create reply object correctly', () => {
    const payload = {
      id: 'reply-abc123',
      content: 'keduax',
      date: new Date(),
      username: 'replier',
      isDeleted: false,
    };

    const reply = new Reply(payload);

    expect(reply.id).toEqual(payload.id);
    expect(reply.content).toEqual(payload.content);
    expect(reply.date).toEqual(payload.date);
    expect(reply.username).toEqual(payload.username);
  });

  it('should create deleted reply object correctly', () => {
    const payload = {
      id: 'reply-abc123',
      content: 'keduax',
      date: new Date(),
      username: 'replier',
      isDeleted: true,
    };

    const reply = new Reply(payload);

    expect(reply.id).toEqual(payload.id);
    expect(reply.content).toEqual('**balasan telah dihapus**');
    expect(reply.date).toEqual(payload.date);
    expect(reply.username).toEqual(payload.username);
  });
});
