package expo.modules.notifications.configuration;

import android.content.Context;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.os.Bundle;

import java.util.HashMap;

public class Configuration {

    private static final String APP_ID_KEY = "expo.modules.notifications.configuration.APP_ID";
    private static final String PUSH_ENGINE_KEY = "expo.modules.notifications.configuration.PUSH_ENGINE";
    public static final String DEFAULT_APP_ID = "defaultId";
    public static final String BARE_ENGINE = "bare";
    public static final String EXPO_ENGINE = "expo";

    private static HashMap<String, String> configuration = new HashMap<>();

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

        configuration.put(name, value);
        return configuration.get(name);
    }

    public static String getAppId(Context context) {
        return getValueFor(APP_ID_KEY, context);
    }

    public static String getPushEngine(Context context) {
        String pushEngine = getValueFor(PUSH_ENGINE_KEY, context);
        if (pushEngine != null) {
            return pushEngine;
        }

        String appId = getAppId(context);
        if (appId.equals(DEFAULT_APP_ID)) {
            return BARE_ENGINE;
        }
        return EXPO_ENGINE;
    }

}
