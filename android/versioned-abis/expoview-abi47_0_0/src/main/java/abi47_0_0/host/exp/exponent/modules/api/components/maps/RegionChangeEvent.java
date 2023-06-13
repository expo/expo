package abi47_0_0.host.exp.exponent.modules.api.components.maps;

import abi47_0_0.com.facebook.react.bridge.WritableMap;
import abi47_0_0.com.facebook.react.bridge.WritableNativeMap;
import abi47_0_0.com.facebook.react.uimanager.events.Event;
import abi47_0_0.com.facebook.react.uimanager.events.RCTEventEmitter;
import com.google.android.gms.maps.model.LatLng;
import com.google.android.gms.maps.model.LatLngBounds;

public class RegionChangeEvent extends Event<RegionChangeEvent> {
  private final LatLngBounds bounds;
  private final boolean continuous;
  private final boolean isGesture;

  public RegionChangeEvent(int id, LatLngBounds bounds, boolean continuous, boolean isGesture) {
    super(id);
    this.bounds = bounds;
    this.continuous = continuous;
    this.isGesture = isGesture;
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
    LatLng center = bounds.getCenter();
    region.putDouble("latitude", center.latitude);
    region.putDouble("longitude", center.longitude);
    region.putDouble("latitudeDelta", bounds.northeast.latitude - bounds.southwest.latitude);
    region.putDouble("longitudeDelta", bounds.northeast.longitude - bounds.southwest.longitude);
    event.putMap("region", region);
    event.putBoolean("isGesture", isGesture);

    rctEventEmitter.receiveEvent(getViewTag(), getEventName(), event);
  }
}
