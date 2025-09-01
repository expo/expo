module.exports = function() {
  return {
    visitor: {
      Identifier: function(path) {
        if (path.node.name !== "helper") return;

        path.replaceWith(this.addHelper("interopRequireDefault"));
      },
    },
  };
};
