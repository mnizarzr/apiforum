class Reply {
  constructor(payload) {
    this._verifyPayload(payload);

    const { id, content, date, username, isDeleted } = payload;

    this.id = id;
    this.content = isDeleted ? '**balasan telah dihapus**' : content;
    this.date = date;
    this.username = username;
  }

  _verifyPayload({ id, content, date, username, isDeleted }){
    if (!id || !content || !date || !username || typeof isDeleted === 'undefined') {
        throw new Error('REPLY.NOT_CONTAIN_NEEDED_PROPERTY');
      }
      if (
        typeof id !== 'string' ||
        typeof content !== 'string' ||
        !(date instanceof Date) ||
        typeof username !== 'string' ||
        typeof isDeleted !== 'boolean'
      ) {
        throw new Error('REPLY.NOT_MEET_DATA_TYPE_SPECIFICATION');
      }
  }

}

module.exports = Reply;
