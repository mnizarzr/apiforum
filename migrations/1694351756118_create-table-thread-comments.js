exports.up = (pgm) => {
  pgm.createTable(
    "thread_comments",
    {
      id: {
        type: "VARCHAR(50)",
        primaryKey: true,
      },
      content: {
        type: "TEXT",
        notNull: true,
      },
      thread_id: {
        type: "VARCHAR(50)",
        notNull: true,
      },
      owner: {
        type: "VARCHAR(50)",
        notNull: true,
      },
      // Note to reviewer: give some feedback on this:
      // I store replies in the same table as comments (using parent_id foreign key)
      // because that's what they say what big social media do.
      // I realize it later to be ambigious when using it in entities.
      parent_id: {
        type: "VARCHAR(50)",
        default: null,
      },
      // I comply to the submission criteria
      // why not using conventional timestamps table
      // like created_at, updated_at, deleted_at?
      date: {
        type: "TIMESTAMP",
        default: pgm.func("current_timestamp"),
        notNull: true,
      },
      is_deleted: {
        type: "BOOLEAN",
        default: false,
      },
    },
    {
      constraints: {
        foreignKeys: [
          {
            columns: "thread_id",
            references: "threads(id)",
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
          },
          {
            columns: "owner",
            references: "users(id)",
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
          },
          {
            columns: "parent_id",
            references: "thread_comments(id)",
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
          },
        ],
      },
    }
  );
};

exports.down = (pgm) => {
  pgm.dropTable("thread_comments");
};
