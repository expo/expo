package expo.modules.notifications.presenters.modifiers;

import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.support.v4.app.NotificationCompat;

import java.util.UUID;

import expo.modules.notifications.configuration.Configuration;
import expo.modules.notifications.userinteractionreceiver.NotificationBroadcastReceiver;

import static expo.modules.notifications.NotificationConstants.NOTIFICATION_OBJECT_KEY;

public class IntentModifier implements NotificationModifier {
  @Override
  public void modify(NotificationCompat.Builder builder, Bundle notification, Context context, String appId) {
    Intent intent = new Intent(context, NotificationBroadcastReceiver.class);
    intent.putExtra(NOTIFICATION_OBJECT_KEY, notification);

    PendingIntent contentIntent = PendingIntent.getBroadcast(
        context,
        UUID.randomUUID().hashCode(),
        intent,
        PendingIntent.FLAG_UPDATE_CURRENT
    );
    builder.setContentIntent(contentIntent);
  }
}
