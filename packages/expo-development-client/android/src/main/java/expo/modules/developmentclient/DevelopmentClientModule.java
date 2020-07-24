package expo.modules.developmentclient;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;

public class DevelopmentClientModule extends ReactContextBaseJavaModule {

    private final ReactApplicationContext reactContext;

    public DevelopmentClientModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return "EXDevelopmentClient";
    }

    @ReactMethod
    public void loadApp(String url, ReadableMap options, final Promise promise) {
        DevelopmentClientController.getInstance().loadApp(reactContext, url, options);
        promise.resolve(null);
    }
}
