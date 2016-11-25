package versioned.host.exp.exponent.modules.api.notifications;

import android.app.Notification;
import android.content.Context;
import android.graphics.Color;
import android.support.annotation.IntegerRes;
import android.support.annotation.Nullable;
import android.support.v4.app.NotificationManagerCompat;

import org.json.JSONObject;

import java.util.Random;

import host.exp.exponent.ExponentManifest;
import host.exp.exponent.utils.ColorParser;

import static host.exp.exponentview.R.layout.notification;

public class NotificationsHelper {

    public static int getColor(
            @Nullable String colorString,
            JSONObject manifest,
            ExponentManifest exponentManifest) {
        JSONObject notificationPreferences = manifest.optJSONObject(ExponentManifest.MANIFEST_NOTIFICATION_INFO_KEY);

        if (colorString == null) {
            colorString = notificationPreferences == null ? null :
                    notificationPreferences.optString(ExponentManifest.MANIFEST_NOTIFICATION_COLOR_KEY);
        }

        int color;

        if (colorString != null && ColorParser.isValid(colorString)) {
            color = Color.parseColor(colorString);
        } else {
            color = exponentManifest.getColorFromManifest(manifest);
        }

        return color;
    }

    public static void loadIcon(String url,
                                JSONObject manifest,
                                ExponentManifest exponentManifest,
                                ExponentManifest.BitmapListener bitmapListener) {
        JSONObject notificationPreferences = manifest.optJSONObject(ExponentManifest.MANIFEST_NOTIFICATION_INFO_KEY);
        String iconUrl;

        if (url == null) {
            iconUrl = manifest.optString(ExponentManifest.MANIFEST_ICON_URL_KEY);
            if (notificationPreferences != null) {
                iconUrl = notificationPreferences.optString(ExponentManifest.MANIFEST_NOTIFICATION_ICON_URL_KEY, null);
            }
        } else {
            iconUrl = url;
        }

        exponentManifest.loadIconBitmap(iconUrl, bitmapListener);
    }
}
