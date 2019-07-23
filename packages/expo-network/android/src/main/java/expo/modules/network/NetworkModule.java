package expo.modules.network;

import java.math.BigInteger;
import java.net.InetAddress;
import java.nio.ByteOrder;
import java.util.Map;

import android.content.Context;
import android.app.Activity;
import android.net.wifi.WifiInfo;
import android.net.wifi.WifiManager;
import android.util.Log;

import org.unimodules.core.ExportedModule;
import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.Promise;
import org.unimodules.core.interfaces.ExpoMethod;
import org.unimodules.core.interfaces.ActivityProvider;
import org.unimodules.core.interfaces.RegistryLifecycleListener;

public class NetworkModule extends ExportedModule implements RegistryLifecycleListener {
  private static final String NAME = "ExpoNetwork";
  private static final String TAG = NetworkModule.class.getSimpleName();
  private Context mContext;
  private ModuleRegistry mModuleRegistry;
  private ActivityProvider mActivityProvider;
  private Activity mActivity;

  public NetworkModule(Context context) {
    super(context);
    mContext = context;
  }

  @Override
  public String getName() {
    return NAME;
  }

  @Override
  public void onCreate(ModuleRegistry moduleRegistry) {
    mModuleRegistry = moduleRegistry;
    mActivityProvider = moduleRegistry.getModule(ActivityProvider.class);
    mActivity = mActivityProvider.getCurrentActivity();
  }

  private WifiInfo getWifiInfo() {
    try {
      WifiManager manager = (WifiManager) mContext.getApplicationContext().getSystemService(Context.WIFI_SERVICE);
      return manager.getConnectionInfo();
    } catch (NullPointerException e) {
      Log.e(TAG, e.getMessage());
      throw e;
    }
  }

  @ExpoMethod
  public void getIpAddressAsync(Promise promise) {
    try {
      Integer ipAddress = getWifiInfo().getIpAddress();
      // Convert little-endian to big-endianif needed
      if (ByteOrder.nativeOrder().equals(ByteOrder.LITTLE_ENDIAN)) {
        ipAddress = Integer.reverseBytes(ipAddress);
      }
      byte[] ipByteArray = BigInteger.valueOf(ipAddress).toByteArray();
      String ipAddressString = InetAddress.getByAddress(ipByteArray).getHostAddress();
      promise.resolve(ipAddressString);
    } catch (Exception e) {
      Log.e(TAG, e.getMessage());
      promise.reject("ERR_DEVICE_UNKNOWN_HOST", "Unknown Host Exception", e);
    }
  }
}
