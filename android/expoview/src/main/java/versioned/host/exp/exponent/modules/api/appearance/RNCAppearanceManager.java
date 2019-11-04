package versioned.host.exp.exponent.modules.api.appearance;

import androidx.annotation.NonNull;

import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewGroupManager;

public class RNCAppearanceManager extends ViewGroupManager<RNCAppearanceProvider> {
    public static final String CLASS_NAME = "RNCAppearanceProvider";
    @NonNull
    @Override
    public String getName() {
        return CLASS_NAME;
    }

    @NonNull
    @Override
    protected RNCAppearanceProvider createViewInstance(@NonNull ThemedReactContext reactContext) {
        return new RNCAppearanceProvider(reactContext);
    }
}
