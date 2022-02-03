import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.ReactRootView;

import expo.modules.ReactActivityDelegateWrapper;

public class MainActivity extends ReactActivity {
  /**
    * Returns the name of the main component registered from JavaScript. This is used to schedule
    * rendering of the component.
    */
  @Override
  protected String getMainComponentName() {
    return "react-native-project";
  }

  @Override
  protected ReactActivityDelegate createReactActivityDelegate() {
    return new ReactActivityDelegateWrapper(this,
      new ReactActivityDelegate(this, getMainComponentName())
    );
  }

  @Override
  protected void onNewIntent(Intent intent) {
    super.onNewIntent(intent);
    setIntent(intent);
  }
}
