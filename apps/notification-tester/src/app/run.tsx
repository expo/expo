import TestScreen from 'test-suite/screens/TestScreen';

const NotificationTestScreen = require('test-suite/tests/Notifications');

// these are expo-notifications tests that are meant to be run on device from the notification-tester app
// they test both local and remote notifications

// yes, this is a hack - but the cost is low and benefit is high
export default class NotificationTesterScreen extends TestScreen {
  constructor(props: any) {
    super(props);
    this.state = {
      ...this.state,
      // @ts-expect-error
      selectedModules: [NotificationTestScreen],
    };
  }

  _handleTestsParam() {
    this._runTests([NotificationTestScreen]);
  }

  componentDidUpdate() {
    // noop
  }

  getSelectionQuery() {
    return '';
  }
}
