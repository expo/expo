package abi18_0_0.host.exp.exponent.modules.api.components.maps;

import abi18_0_0.com.facebook.react.bridge.WritableMap;
import abi18_0_0.com.facebook.react.bridge.WritableNativeMap;
import abi18_0_0.com.facebook.react.uimanager.events.Event;
import abi18_0_0.com.facebook.react.uimanager.events.RCTEventEmitter;
import com.google.android.gms.maps.model.LatLng;
import com.google.android.gms.maps.model.LatLngBounds;

public class RegionChangeEvent extends Event<RegionChangeEvent> {
    private final LatLngBounds bounds;
    private final LatLng center;
    private final boolean continuous;

    public RegionChangeEvent(int id, LatLngBounds bounds, LatLng center, boolean continuous) {
        super(id);
        this.bounds = bounds;
        this.center = center;
        this.continuous = continuous;
    }

    @Override
    public String getEventName() {
        return "topChange";
    }

    @Override
    public boolean canCoalesce() {
        return false;
    }

    @Override
    public void dispatch(RCTEventEmitter rctEventEmitter) {

        WritableMap event = new WritableNativeMap();
        event.putBoolean("continuous", continuous);

        WritableMap region = new WritableNativeMap();
        region.putDouble("latitude", center.latitude);
        region.putDouble("longitude", center.longitude);
        region.putDouble("latitudeDelta", bounds.northeast.latitude - bounds.southwest.latitude);
        region.putDouble("longitudeDelta", bounds.northeast.longitude - bounds.southwest.longitude);
        event.putMap("region", region);

        rctEventEmitter.receiveEvent(getViewTag(), getEventName(), event);
    }
}
