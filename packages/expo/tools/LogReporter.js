const serializeError = require('serialize-error');

class LogReporter {
  update(event) {
    if (event.error instanceof Error) {
      event.error = serializeError(event.error);
    }

    console.log(JSON.stringify(event));
  }
}

module.exports = LogReporter;
