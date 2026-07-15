'use strict';
module.exports = {
  isatty: () => false,
  ReadStream: function () { throw new Error('tty.ReadStream not available in Hermes runtime'); },
  WriteStream: function () { throw new Error('tty.WriteStream not available in Hermes runtime'); },
};
