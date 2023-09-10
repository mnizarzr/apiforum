exports.up = (pgm) => {
  pgm.createTable(
    "threads",
    {
      id: {
        type: "VARCHAR(50)",
        primaryKey: true,
      },
      title: {
        type: "TEXT",
        notNull: true,
      },
      body: {
        type: "TEXT",
        notNull: true,
      },
      owner: {
        type: "VARCHAR(50)",
        notNull: true,
      },
      date: {
        type: "TIMESTAMP",
        default: pgm.func("current_timestamp"),
        notNull: true,
      },
    },
    {
      constraints: {
        foreignKeys: [
          {
            columns: "owner",
            references: "users(id)",
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
          },
        ],
      },
    }
  );
};

exports.down = (pgm) => {
  pgm.dropTable("threads");
};
