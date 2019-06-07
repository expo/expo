package expo.modules.notifications.presenters;

import android.content.Context;
import android.os.Bundle;
import android.support.v4.app.NotificationCompat;
import android.support.v4.app.NotificationManagerCompat;

import java.util.ArrayList;
import java.util.List;

import expo.modules.notifications.presenters.modifiers.StickyModifier;
import expo.modules.notifications.presenters.modifiers.BodyModifier;
import expo.modules.notifications.presenters.modifiers.CategoryModifier;
import expo.modules.notifications.presenters.modifiers.ChannelModifier;
import expo.modules.notifications.presenters.modifiers.ColorModifier;
import expo.modules.notifications.presenters.modifiers.AppIdModifier;
import expo.modules.notifications.presenters.modifiers.IconModifier;
import expo.modules.notifications.presenters.modifiers.ImportanceModifier;
import expo.modules.notifications.presenters.modifiers.IntentModifier;
import expo.modules.notifications.presenters.modifiers.LinkModifier;
import expo.modules.notifications.presenters.modifiers.NotificationModifier;
import expo.modules.notifications.presenters.modifiers.SoundModifer;
import expo.modules.notifications.presenters.modifiers.TitleModifier;
import expo.modules.notifications.presenters.modifiers.VibrateModifier;

public class NotificationPresenterImpl implements NotificationPresenter {

  private volatile static List<NotificationModifier> mModifiers = null;

  @Override
  public void presentNotification(Context context, String appId, Bundle notification, final int notificationId) {

    new Thread(() -> {
      NotificationCompat.Builder builder = new NotificationCompat.Builder(context);

      notification.putInt("notificationIntId", notificationId);

      for (NotificationModifier notificationModifier : NotificationPresenterImpl.getNotificationModifiers()) {
        notificationModifier.modify(builder, notification, context, appId);
      }

      NotificationManagerCompat notificationManagerCompat = NotificationManagerCompat.from(context);
      notificationManagerCompat.notify(appId, notificationId, builder.build());

    }).start(); // this may result in leak (anonymous class is a inner class so it has ref to outer class)

  }

  public static synchronized List<NotificationModifier> getNotificationModifiers() {
    if (mModifiers != null) {
      return mModifiers;
    }
    mModifiers = new ArrayList<>();

    /*
    The order is important because ChannelModifier adds additional options to the notification bundle
     */

    mModifiers.add(new AppIdModifier());
    mModifiers.add(new ChannelModifier());
    mModifiers.add(new VibrateModifier());
    mModifiers.add(new StickyModifier());
    mModifiers.add(new TitleModifier());
    mModifiers.add(new BodyModifier());
    mModifiers.add(new SoundModifer());
    mModifiers.add(new IconModifier());
    mModifiers.add(new ImportanceModifier());
    mModifiers.add(new ColorModifier());
    mModifiers.add(new IntentModifier());
    mModifiers.add(new LinkModifier());
    mModifiers.add(new CategoryModifier());

    return mModifiers;
  }

}
