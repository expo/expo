const serializeError = require('serialize-error');
/**
 * @deprecated: Remove in SDK 38
 * https://github.com/expo/expo-cli/pull/1269
 */
class LogReporter {
  update(event) {
    if (event.error instanceof Error) {
      event.error = serializeError(event.error);
    }

    console.log(JSON.stringify(event));
  }
}

module.exports = LogReporter;
