exports.up = (pgm) => {
  pgm.createTable(
    'thread_comment_replies',
    {
      id: {
        type: 'VARCHAR(50)',
        primaryKey: true,
      },
      comment_id: {
        type: 'VARCHAR(50)',
        notNull: true,
      },
      thread_id: {
        type: 'VARCHAR(50)',
        notNull: true,
      },
      owner: {
        type: 'VARCHAR(50)',
        notNull: true,
      },
      content: {
        type: 'TEXT',
        notNull: true,
      },
      date: {
        type: 'TIMESTAMP',
        default: pgm.func('current_timestamp'),
        notNull: true,
      },
      is_deleted: {
        type: 'BOOLEAN',
        default: false,
      },
    },
    {
      constraints: {
        foreignKeys: [
          {
            columns: 'thread_id',
            references: 'threads(id)',
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          {
            columns: 'owner',
            references: 'users(id)',
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          {
            columns: 'comment_id',
            references: 'thread_comments(id)',
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
        ],
      },
    }
  );
};

exports.down = (pgm) => {
  pgm.dropTable('thread_comment_replies');
};
