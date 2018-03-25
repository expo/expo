export default {
  clearConsole() {
    return {
      type: 'clearConsole',
    };
  },

  logUncaughtError(id, message, stack, fatal, browserTaskUrl = null) {
    return {
      type: 'logUncaughtError',
      payload: {
        id,
        time: new Date(),
        message: [message],
        stack,
        fatal,
        url: browserTaskUrl,
      },
    };
  },
};
