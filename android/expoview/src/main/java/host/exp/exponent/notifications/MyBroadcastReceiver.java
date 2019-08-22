package host.exp.exponent.notifications;

import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.net.Uri;
import android.os.Bundle;
import android.os.PersistableBundle;
import android.support.v4.content.LocalBroadcastManager;
import android.util.Log;
import android.widget.Toast;

import com.facebook.react.HeadlessJsTaskService;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import org.unimodules.interfaces.taskManager.TaskInterface;

import java.util.Collections;

import javax.annotation.Nonnull;

import expo.modules.taskManager.TaskBroadcastReceiver;
import expo.modules.taskManager.TaskManagerUtils;
import host.exp.exponent.kernel.ExperienceId;
import host.exp.exponent.kernel.KernelConstants;
import versioned.host.exp.exponent.modules.ExpoBaseModule;
import versioned.host.exp.exponent.modules.api.notifications.NotificationBackgroundTaskConsumer;

public class MyBroadcastReceiver extends BroadcastReceiver {
  private static final String TAG = "MyBroadcastReceiver";
  @Override
  public void onReceive(Context context, Intent intent) {
    //StringBuilder sb = new StringBuilder();
    //sb.append("Action: " + intent.getAction() + "\n");
    //sb.append("URI: " + intent.toUri(Intent.URI_INTENT_SCHEME).toString() + "\n");
    String log = intent.toString();
    Log.i(TAG, "HAHA I RECIEVED THIS!!!");
    Log.i(TAG, log);
    //Toast.makeText(context, log, Toast.LENGTH_LONG).show();

    Bundle bundle = intent.getExtras();
    String notificationObject = bundle.getString(KernelConstants.NOTIFICATION_OBJECT_KEY);
    String notificationManifestUrl = bundle.getString(KernelConstants.NOTIFICATION_MANIFEST_URL_KEY);
    String actionId = bundle.getString(KernelConstants.NOTIFICATION_ACTION_TYPE_KEY);

    //if (notificationManifestUrl != null) {
    ExponentNotification exponentNotification = ExponentNotification.fromJSONObjectString(notificationObject);
    PersistableBundle data = exponentNotification.toPersistableBundle("selected");
    data.putString(NotificationConstants.NOTIFICATION_ACTION_TYPE, actionId);

    TaskInterface myTask = NotificationBackgroundTaskConsumer.mTasks.get("hahayep");

    TaskManagerUtils mTaskManagerUtils = new TaskManagerUtils();
    mTaskManagerUtils.scheduleJob(context, myTask, Collections.singletonList(data));

    /*try {
      mTaskManagerUtils.createTaskIntent(context, NotificationBackgroundTaskConsumer.mTasks.get("hahayep")).send();
    } catch (Exception e) {

    }*/


    /*Intent serviceIntent = new Intent(context, MyTaskService.class);
    serviceIntent.putExtra("hasInternet", "hello world");
    context.startService(serviceIntent);
    HeadlessJsTaskService.acquireWakeLockNow(context);*/

    /*Intent service = new Intent(context.getApplicationContext(), MyTaskService.class);
    Bundle bundle = new Bundle();

    bundle.putString("foo", "bar");
    service.putExtras(bundle);

    context.getApplicationContext().startService(service);
    HeadlessJsTaskService.acquireWakeLockNow(context.getApplicationContext());*/
  }

  private PendingIntent createTaskIntent(Context context, String appId, String taskName, int flags) {
    if (context == null) {
      return null;
    }

    Intent intent = new Intent(TaskBroadcastReceiver.INTENT_ACTION, null, context, TaskBroadcastReceiver.class);

    Uri dataUri = new Uri.Builder()
        .appendQueryParameter("appId", appId)
        .appendQueryParameter("taskName", "hahayep")
        .build();

    intent.setData(dataUri);

    Log.i("HAHA", "PLLLLLLLLLLLZ THIS BE CALLED!!!!");

    context.sendBroadcast(intent);

    return PendingIntent.getBroadcast(context, 6666, intent, flags);
  }

}




/*
        RNObject rctDeviceEventEmitter = new RNObject("com.facebook.react.modules.core.DeviceEventManagerModule$RCTDeviceEventEmitter");
        rctDeviceEventEmitter.loadVersion(mDetachSdkVersion);

        mReactInstanceManager.callRecursive("getCurrentReactContext")
            .callRecursive("getJSModule", rctDeviceEventEmitter.rnClass())
            .call("emit", "Exponent.notification", options.notificationObject.toWriteableMap(mDetachSdkVersion, "selected"));
 */

/*public class SomeNativeModule extends ExpoBaseModule {

  private ReactContext mReactContext;
  // instance of our receiver
  private MyBroadcastReceiver mLocalBroadcastReceiver;

  @Nonnull
  @Override
  public String getName() {
    return "SomeNativeModule";
  }

  public SomeNativeModule(ReactApplicationContext reactContext, ExperienceId experienceId) {
    super(reactContext, experienceId);
    this.mReactContext = reactContext;
    this.mLocalBroadcastReceiver = new MyBroadcastReceiver();
    LocalBroadcastManager localBroadcastManager = LocalBroadcastManager.getInstance(reactContext);
    localBroadcastManager.registerReceiver(mLocalBroadcastReceiver, new IntentFilter("my-custom-event"));
  }
  public class MyBroadcastReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
      String someData = intent.getStringExtra("my-extra-data");
      mReactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
          .emit("Exponent.notification", someData);
    }
  }
}
*/