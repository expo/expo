package expo.modules.notifications.displayers.modifiers;

import android.content.Context;
import android.os.Bundle;
import androidx.core.app.NotificationCompat;

public interface NotificationModifier {

  void modify(NotificationCompat.Builder builder, Bundle notification, Context context, String appId);

}
