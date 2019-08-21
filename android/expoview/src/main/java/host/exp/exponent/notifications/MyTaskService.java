package host.exp.exponent.notifications;

import android.content.Intent;
import android.os.Bundle;
import android.support.annotation.Nullable;
import android.util.Log;

import com.facebook.react.HeadlessJsTaskService;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.jstasks.HeadlessJsTaskConfig;

public class MyTaskService extends HeadlessJsTaskService {
  private static final String TAG = "MyTaskService";

  @Override
  protected @Nullable
  HeadlessJsTaskConfig getTaskConfig(Intent intent) {
    Bundle extras = intent.getExtras();
    Log.i(TAG, "HOHO");
    if (extras != null) {
      Log.i(TAG, "PREPARING TO HeadlessJsTaskConfig");
      Log.i(TAG, extras.toString());
      return new HeadlessJsTaskConfig(
          "SomeTaskName",
          Arguments.fromBundle(extras),
          5000, // timeout for the task
          true // optional: defines whether or not  the task is allowed in foreground. Default is false
      );
    }
    return null;
  }
}
