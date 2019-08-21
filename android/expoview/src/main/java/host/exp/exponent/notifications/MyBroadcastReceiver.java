package host.exp.exponent.notifications;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Bundle;
import android.support.v4.content.LocalBroadcastManager;
import android.util.Log;
import android.widget.Toast;

import com.facebook.react.HeadlessJsTaskService;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import javax.annotation.Nonnull;

import host.exp.exponent.kernel.ExperienceId;
import versioned.host.exp.exponent.modules.ExpoBaseModule;

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

    /*Intent serviceIntent = new Intent(context, MyTaskService.class);
    serviceIntent.putExtra("hasInternet", "hello world");
    context.startService(serviceIntent);
    HeadlessJsTaskService.acquireWakeLockNow(context);*/

    Intent service = new Intent(context.getApplicationContext(), MyTaskService.class);
    Bundle bundle = new Bundle();

    bundle.putString("foo", "bar");
    service.putExtras(bundle);

    context.getApplicationContext().startService(service);
    HeadlessJsTaskService.acquireWakeLockNow(context.getApplicationContext());
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