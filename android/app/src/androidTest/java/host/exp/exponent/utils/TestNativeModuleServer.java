// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.utils;

import android.os.Handler;
import android.support.test.uiautomator.Configurator;
import android.support.test.uiautomator.UiDevice;
import android.support.test.uiautomator.UiObject;
import android.support.test.uiautomator.UiSelector;
import android.util.Log;

import de.greenrobot.event.EventBus;
import host.exp.exponent.test.TestActionEvent;
import host.exp.exponent.test.TestResolvePromiseEvent;

public class TestNativeModuleServer {

  private static final String TAG = TestNativeModuleServer.class.getSimpleName();

  private static TestNativeModuleServer sInstance;
  private UiDevice mUiDevice;

  public static TestNativeModuleServer getInstance() {
    if (sInstance == null) {
      sInstance = new TestNativeModuleServer();
    }

    return sInstance;
  }

  private TestNativeModuleServer() {
    EventBus.getDefault().register(this);
  }

  public void setUiDevice(final UiDevice uiDevice) {
    mUiDevice = uiDevice;
  }

  public void onEvent(final TestActionEvent event) {
    if (event.delay <= 0) {
      performAction(event);
    } else {
      new Handler().postDelayed(new Runnable() {
        @Override
        public void run() {
          performAction(event);
        }
      }, event.delay);
    }
  }

  private void performAction(final TestActionEvent event) {
    synchronized (this) {
      try {
        Configurator.getInstance().setWaitForSelectorTimeout(event.timeout);
        UiSelector selector = getSelectorForObject(event);
        UiObject object = mUiDevice.findObject(selector);
        runActionOnObject(event, object);
      } catch (Throwable e) {
        Log.d(TAG, "Error in performAction: " + e.toString());
      } finally {
        EventBus.getDefault().post(new TestResolvePromiseEvent(event.id));
      }
    }
  }

  private UiSelector getSelectorForObject(TestActionEvent event) {
    switch (event.selectorType) {
      case "text":
        return new UiSelector().text(event.selectorValue);
      default:
        throw new RuntimeException("No selector found for type " + event.selectorType);
    }
  }

  private void runActionOnObject(TestActionEvent event, UiObject object) {
    try {
      switch (event.actionType) {
        case "click":
          object.click();
          break;
        default:
          throw new RuntimeException("No action found for type " + event.actionType);
      }
    } catch (Exception e) {
      throw new RuntimeException(e.toString());
    }
  }
}
