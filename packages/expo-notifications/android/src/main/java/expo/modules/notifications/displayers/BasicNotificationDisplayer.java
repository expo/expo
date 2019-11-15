package expo.modules.notifications.displayers;

import android.content.Context;
import android.os.Bundle;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

import java.util.ArrayList;
import java.util.List;

import expo.modules.notifications.displayers.modifiers.MainModifier;
import expo.modules.notifications.displayers.modifiers.CategoryModifier;
import expo.modules.notifications.displayers.modifiers.ChannelModifier;
import expo.modules.notifications.displayers.modifiers.IconModifier;
import expo.modules.notifications.displayers.modifiers.ImportanceModifier;
import expo.modules.notifications.displayers.modifiers.IntentModifier;
import expo.modules.notifications.displayers.modifiers.LinkModifier;
import expo.modules.notifications.displayers.modifiers.NotificationModifier;
import expo.modules.notifications.displayers.modifiers.SoundModifer;
import expo.modules.notifications.displayers.modifiers.VibrateModifier;

public class BasicNotificationDisplayer implements NotificationDisplayer {

  private volatile static List<NotificationModifier> mModifiers = null;

  static {
    mModifiers = new ArrayList<>();

    /*
    The order is important because ChannelModifier adds additional options to the notification bundle
     */

    mModifiers.add(new MainModifier());
    mModifiers.add(new ChannelModifier());
    mModifiers.add(new VibrateModifier());
    mModifiers.add(new SoundModifer());
    mModifiers.add(new IconModifier());
    mModifiers.add(new ImportanceModifier());
    mModifiers.add(new IntentModifier());
    mModifiers.add(new LinkModifier());
    mModifiers.add(new CategoryModifier());
  }

  @Override
  public void displayNotification(Context context, String appId, Bundle notification, final int notificationId) {

    new Thread(() -> {
      NotificationCompat.Builder builder = new NotificationCompat.Builder(context);

      notification.putInt("notificationIntId", notificationId);

      for (NotificationModifier notificationModifier : mModifiers) {
        notificationModifier.modify(builder, notification, context, appId);
      }

      NotificationManagerCompat notificationManagerCompat = NotificationManagerCompat.from(context);
      notificationManagerCompat.notify(appId, notificationId, builder.build());

    }).start(); // this may result in leak (anonymous class is a inner class so it has ref to outer class)

  }

}
