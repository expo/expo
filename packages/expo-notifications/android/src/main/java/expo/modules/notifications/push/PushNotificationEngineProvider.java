package expo.modules.notifications.push;

import android.content.Context;

import java.util.HashMap;
import java.util.Map;

import expo.modules.notifications.configuration.Configuration;
import expo.modules.notifications.push.TokenDispatcher.engines.BareEngine;
import expo.modules.notifications.push.TokenDispatcher.engines.Engine;
import expo.modules.notifications.push.TokenDispatcher.engines.ExpoEngine;

import static expo.modules.notifications.configuration.Configuration.BARE_ENGINE;
import static expo.modules.notifications.configuration.Configuration.EXPO_ENGINE;

public class PushNotificationEngineProvider {

    private static Map<String, Engine> engines;

    public synchronized static Engine getPushNotificationEngine(Context context) {
        init();
        return engines.get(Configuration.getPushEngine(context));
    }

    private static void init() {
        if (engines == null) {
            engines = new HashMap<>();
            engines.put(BARE_ENGINE, new BareEngine());
            engines.put(EXPO_ENGINE, new ExpoEngine());
        }
    }

}
