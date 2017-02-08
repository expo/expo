// Copyright 2015-present 650 Industries. All rights reserved.

package versioned.host.exp.exponent.modules.test;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;

import de.greenrobot.event.EventBus;
import host.exp.exponent.test.TestCompletedEvent;
import host.exp.exponent.test.TestActionEvent;

public class ExponentTestNativeModule extends ReactContextBaseJavaModule {

  public ExponentTestNativeModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public String getName() {
    return "ExponentTest";
  }

  @ReactMethod
  public void action(final ReadableMap options) {
    String selectorType = options.getString("selectorType");
    String selectorValue = null;
    if (options.hasKey("selectorValue")) {
      selectorValue = options.getString("selectorValue");
    }

    String actionType = options.getString("actionType");
    String actionValue = null;
    if (options.hasKey("actionValue")) {
      actionValue = options.getString("actionValue");
    }

    int delay = 0;
    if (options.hasKey("delay")) {
      delay = options.getInt("delay");
    }
    EventBus.getDefault().post(new TestActionEvent(selectorType, selectorValue, actionType, actionValue, delay));
  }

  @ReactMethod
  public void completed(final String stringifiedJson) {
    EventBus.getDefault().post(new TestCompletedEvent(stringifiedJson));
  }
}
