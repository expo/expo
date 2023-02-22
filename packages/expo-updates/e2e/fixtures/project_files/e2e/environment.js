const {
  DetoxCircusEnvironment,
  SpecReporter,
  WorkerAssignReporter,
} = require('detox/runners/jest-circus');

class CustomDetoxEnvironment extends DetoxCircusEnvironment {
  constructor(config, context) {
    super(config, context);

    // Can be safely removed, if you are content with the default value (=300000ms)
    this.initTimeout = 300000;

    // This takes care of generating status logs on a per-spec basis. By default, Jest only reports at file-level.
    // This is strictly optional.
    this.registerListeners({
      SpecReporter,
      WorkerAssignReporter,
    });
  }

  async handleTestEvent(event, state) {
    const { name } = event;

    if (['test_start', 'test_fn_start'].includes(name)) {
      this.global.testFailed = false;
    }

    if (name === 'test_fn_failure') {
      this.global.testFailed = true;
    }

    await super.handleTestEvent(event, state);
  }
}

module.exports = CustomDetoxEnvironment;
