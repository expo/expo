package expo.modules.notifications.helpers.scoper;

import java.util.Map;

import static expo.modules.notifications.NotificationConstants.NOTIFICATION_CATEGORY;
import static expo.modules.notifications.NotificationConstants.NOTIFICATION_CHANNEL_ID;

public class NotificationScoper {

    private StringScoper mStringScoper = null;

    public NotificationScoper(StringScoper stringScoper) {
        mStringScoper = stringScoper;
    }

    public <T extends Map>  T scope(T notification) {
        if (notification.containsKey(NOTIFICATION_CATEGORY)) {
            String category = (String) notification.get(NOTIFICATION_CATEGORY);
            notification.put(NOTIFICATION_CATEGORY, mStringScoper.getScopedString(category));
        }

        if (notification.containsKey(NOTIFICATION_CHANNEL_ID)) {
            String channelId = (String) notification.get(NOTIFICATION_CHANNEL_ID);
            notification.put(NOTIFICATION_CHANNEL_ID, mStringScoper.getScopedString(channelId));
        }

        return notification;
    }
}
