package expo.modules.notifications.presenters.modifiers;

import android.content.Context;
import android.os.Bundle;
import android.support.v4.app.NotificationCompat;

public interface NotificationModifier {

  void modify(NotificationCompat.Builder builder, Bundle notification, Context context, String appId);

}
