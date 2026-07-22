const withIdJSON = (schema) => {
  schema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: (_doc, ret) => {
      delete ret._id;
    },
  });
};

module.exports = withIdJSON;
