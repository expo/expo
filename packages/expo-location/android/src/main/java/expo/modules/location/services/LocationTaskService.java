package expo.modules.location.services;

import android.annotation.TargetApi;
import android.app.Activity;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.os.Binder;
import android.os.Build;
import android.os.Bundle;
import android.os.IBinder;
import androidx.annotation.Nullable;
import android.util.Log;

public class LocationTaskService extends Service {
  private static final String TAG = "LocationTaskService";
  private static int sServiceId = 481756;
  private String mChannelId;
  private boolean mKillService = false;
  private Context mParentContext;
  private int mServiceId = sServiceId++;
  private final IBinder mBinder = new ServiceBinder();

  public class ServiceBinder extends Binder {
    public LocationTaskService getService() {
      return LocationTaskService.this;
    }
  }

  @Nullable
  @Override
  public IBinder onBind(Intent intent) {
    Log.w(TAG, "onBind");
    return mBinder;
  }

  @Override
  @TargetApi(26)
  public int onStartCommand(Intent intent, int flags, int startId) {
    Bundle extras = intent.getExtras();

    if (extras != null) {
      mChannelId = extras.getString("appId") + ":" + extras.getString("taskName");
      mKillService = extras.getBoolean("killService", false);
    }

    return START_REDELIVER_INTENT;
  }

  public void setParentContext(Context context) {
    // Background location logic is still outside LocationTaskService,
    // so we have to save parent context in order to make sure it won't be destroyed by the OS.
    mParentContext = context;
  }

  public void stop() {
    stopForeground(true);
    stopSelf();
  }

  @Override
  public void onTaskRemoved(Intent rootIntent) {
    if (mKillService){
      super.onTaskRemoved(rootIntent);
      stop();
    }
  }

  public void startForeground(Bundle serviceOptions) {
    Notification notification = buildServiceNotification(serviceOptions);
    startForeground(mServiceId, notification);
  }

  //region private

  @TargetApi(26)
  private Notification buildServiceNotification(Bundle serviceOptions) {
    prepareChannel(mChannelId);

    Notification.Builder builder = new Notification.Builder(this, mChannelId);

    String title = serviceOptions.getString("notificationTitle");
    String body = serviceOptions.getString("notificationBody");
    Integer color = colorStringToInteger(serviceOptions.getString("notificationColor"));

    if (title != null) {
      builder.setContentTitle(title);
    }
    if (body != null) {
      builder.setContentText(body);
    }
    if (color != null) {
      builder.setColorized(true).setColor(color);
    } else {
      builder.setColorized(false);
    }

    Intent intent = mParentContext.getPackageManager().getLaunchIntentForPackage(mParentContext.getPackageName());

    if (intent != null) {
      intent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
      // We're defaulting to the behaviour prior API 31 (mutable) even though Android recommends immutability
      int mutableFlag = Build.VERSION.SDK_INT >= Build.VERSION_CODES.S ? PendingIntent.FLAG_MUTABLE : 0;
      PendingIntent contentIntent = PendingIntent.getActivity(this, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT | mutableFlag);
      builder.setContentIntent(contentIntent);
    }

    return builder.setCategory(Notification.CATEGORY_SERVICE)
        .setSmallIcon(getApplicationInfo().icon)
        .build();
  }

  @TargetApi(26)
  private void prepareChannel(String id) {
    NotificationManager notificationManager = (NotificationManager) getSystemService(Activity.NOTIFICATION_SERVICE);

    if (notificationManager != null) {
      String appName = getApplicationInfo().loadLabel(getPackageManager()).toString();
      NotificationChannel channel = notificationManager.getNotificationChannel(id);

      if (channel == null) {
        channel = new NotificationChannel(id, appName, NotificationManager.IMPORTANCE_LOW);
        channel.setDescription("Background location notification channel");
        notificationManager.createNotificationChannel(channel);
      }
    }
  }

  private Integer colorStringToInteger(String color) {
    try {
      return Color.parseColor(color);
    } catch (Exception e) {
      return null;
    }
  }

  //endregion
}
