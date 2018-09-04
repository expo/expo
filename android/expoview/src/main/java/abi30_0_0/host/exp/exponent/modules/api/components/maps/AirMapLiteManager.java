package abi30_0_0.host.exp.exponent.modules.api.components.maps;

import abi30_0_0.com.facebook.react.bridge.ReactApplicationContext;
import com.google.android.gms.maps.GoogleMapOptions;

public class AirMapLiteManager extends AirMapManager {

  private static final String REACT_CLASS = "AIRMapLite";

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  public AirMapLiteManager(ReactApplicationContext context) {
    super(context);
    this.googleMapOptions = new GoogleMapOptions().liteMode(true);
  }

}
