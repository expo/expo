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

    private static HashMap<String, String> configuration = new HashMap<>();

    private static HashMap<String, String> defaultValues = new HashMap<>();

    static {
        defaultValues.put(APP_ID_KEY, "defaultId");
        defaultValues.put(NOTIFICATION_ACTIVITY_NAME_KEY, null);
        defaultValues.put(PUSH_ENGINE_KEY, "bare");
    }

    private static String getValueFor(String name, Context context) {
        if (configuration.containsKey(name)) {
            return configuration.get(name);
        }

        String value = null;
        try {
            ApplicationInfo ai = context.getPackageManager().getApplicationInfo(context.getPackageName(), PackageManager.GET_META_DATA);
            Bundle bundle = ai.metaData;
            value = bundle.getString(name);
        } catch (Exception e) {
            e.printStackTrace();
        }

        if (value == null) {
            configuration.put(name, defaultValues.get(name));
        } else {
            configuration.put(name, value);
        }
        return configuration.get(name);
    }

    public static String getAppId(Context context) {
        return getValueFor(APP_ID_KEY, context);
    }

    public static String getPushEngine(Context context) {
        return getValueFor(PUSH_ENGINE_KEY, context);
    }

    public static String getNotificationActivityName(Context context) {
        return getValueFor(NOTIFICATION_ACTIVITY_NAME_KEY, context);
    }

}
