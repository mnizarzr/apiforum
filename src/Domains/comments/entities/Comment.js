class Comment {
  constructor(payload) {
    this._verifyPayload(payload);

    const { id, content, username, date, replies, isDeleted } = payload;

    this.id = id;
    this.content = isDeleted ? '**komentar telah dihapus**' : content;
    this.username = username;
    this.date = date;
    this.replies = replies;
  }

  _verifyPayload({ id, content, username, date, replies, isDeleted }) {
    if (!id || !content || !username || !date || !replies || typeof isDeleted === 'undefined') {
      throw new Error('COMMENT.NOT_CONTAIN_NEEDED_PROPERTY');
    }
    if (
      typeof id !== 'string' ||
      typeof content !== 'string' ||
      typeof username !== 'string' ||
      !(date instanceof Date) ||
      !Array.isArray(replies) ||
      typeof isDeleted !== 'boolean'
    ) {
      throw new Error('COMMENT.NOT_MEET_DATA_TYPE_SPECIFICATION');
    }
  }
}
module.exports = Comment;
