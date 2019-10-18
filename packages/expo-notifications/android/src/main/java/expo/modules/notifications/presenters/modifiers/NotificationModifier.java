package expo.modules.notifications.presenters.modifiers;

import android.content.Context;
import android.os.Bundle;
import androidx.core.app.NotificationCompat;

public interface NotificationModifier {

  void modify(NotificationCompat.Builder builder, Bundle notification, Context context, String appId);

}
