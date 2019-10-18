package expo.modules.notifications.configuration;

import android.content.Context;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.os.Bundle;

import java.util.HashMap;

public class Configuration {

    public static String APP_ID_KEY = "appId";
    public static String NOTIFICATION_ACTIVITY_NAME_KEY = "notificationReceiver";
    public static String PUSH_ENGINE_KEY = "pushNotificationEngine";

    static HashMap<String, String> configuration = new HashMap<>();

    static HashMap<String, String> defaultValues = new HashMap<>();

    static {
        defaultValues.put(APP_ID_KEY, "defaultId");
        defaultValues.put(NOTIFICATION_ACTIVITY_NAME_KEY, null);
        defaultValues.put(PUSH_ENGINE_KEY, "bare");
    }

    public static String getValueFor(String name, Context context) {
        if (configuration.containsKey(name)) {
            return configuration.get(name);
        }

        String value = null;
        try {
            ApplicationInfo ai = context.getPackageManager().getApplicationInfo(context.getPackageName(), PackageManager.GET_META_DATA);
            Bundle bundle = ai.metaData;
            value = bundle.getString(name);
        } catch (Exception e) {

        }
        if (value == null) {
            configuration.put(name, defaultValues.get(name));
        } else {
            configuration.put(name, value);
        }
        return configuration.get(name);
    }

}
