package expo.modules.notifications.helpers.scoper;

import android.os.Bundle;

public class MessageUnscoper {

  public static Bundle getUnscopedMessage(Bundle message, StringScoper stringScoper) {
    for (String key : message.keySet()) {
      Object value = message.get(key);
      if (value instanceof String) {
        message.putString(key, stringScoper.getUnscopedString((String) value));
      }
    }
    return message;
  }

}
