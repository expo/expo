package abi40_0_0.expo.modules.cellular;

import java.util.HashMap;
import java.util.Map;

import android.content.Context;
import android.content.pm.PackageManager;
import android.net.sip.SipManager;
import android.telephony.TelephonyManager;

import abi40_0_0.org.unimodules.core.ExportedModule;
import abi40_0_0.org.unimodules.core.ModuleRegistry;
import abi40_0_0.org.unimodules.core.Promise;
import abi40_0_0.org.unimodules.core.interfaces.ExpoMethod;
import abi40_0_0.org.unimodules.core.interfaces.RegistryLifecycleListener;

public class CellularModule extends ExportedModule implements RegistryLifecycleListener {
  private static final String NAME = "ExpoCellular";
  private static final String TAG = CellularModule.class.getSimpleName();

  private ModuleRegistry mModuleRegistry;
  private Context mContext;

  public CellularModule(Context context) {
    super(context);
    mContext = context;
  }

  public enum CellularGeneration {
    UNKNOWN(0),
    CG_2G(1),
    CG_3G(2),
    CG_4G(3);

    private final int value;

    CellularGeneration(int value) {
      this.value = value;
    }

    public int getValue() {
      return value;
    }
  }

  @Override
  public String getName() {
    return NAME;
  }

  @Override
  public void onCreate(ModuleRegistry moduleRegistry) {
    mModuleRegistry = moduleRegistry;
  }

  @Override
  public Map<String, Object> getConstants() {
    HashMap<String, Object> constants = new HashMap<>();
    constants.put("allowsVoip", SipManager.isVoipSupported(mContext));

    TelephonyManager tm = (TelephonyManager) mContext.getSystemService(Context.TELEPHONY_SERVICE);
    constants.put("isoCountryCode", tm != null ? tm.getSimCountryIso() : null);

    //check if sim state is ready
    if (tm != null && tm.getSimState() == TelephonyManager.SIM_STATE_READY) {
      constants.put("carrier", tm.getSimOperatorName());
      String combo = tm.getSimOperator();
      constants.put("mobileCountryCode", combo != null ? combo.substring(0, 3) : null);
      StringBuilder sb = null;
      if (combo != null) {
        sb = new StringBuilder(combo);
        sb.delete(0, 3);
      }
      constants.put("mobileNetworkCode", sb != null ? sb.toString() : null);
    } else {
      constants.put("carrier", null);
      constants.put("mobileCountryCode", null);
      constants.put("mobileNetworkCode", null);
    }
    return constants;
  }

  @ExpoMethod
  public void getCellularGenerationAsync(Promise promise) {
    try {
      TelephonyManager mTelephonyManager = (TelephonyManager)
          mContext.getSystemService(Context.TELEPHONY_SERVICE);
      int networkType = mTelephonyManager.getNetworkType();
      switch (networkType) {
        case TelephonyManager.NETWORK_TYPE_GPRS:
        case TelephonyManager.NETWORK_TYPE_EDGE:
        case TelephonyManager.NETWORK_TYPE_CDMA:
        case TelephonyManager.NETWORK_TYPE_1xRTT:
        case TelephonyManager.NETWORK_TYPE_IDEN:
          promise.resolve(CellularGeneration.CG_2G.getValue());
        case TelephonyManager.NETWORK_TYPE_UMTS:
        case TelephonyManager.NETWORK_TYPE_EVDO_0:
        case TelephonyManager.NETWORK_TYPE_EVDO_A:
        case TelephonyManager.NETWORK_TYPE_HSDPA:
        case TelephonyManager.NETWORK_TYPE_HSUPA:
        case TelephonyManager.NETWORK_TYPE_HSPA:
        case TelephonyManager.NETWORK_TYPE_EVDO_B:
        case TelephonyManager.NETWORK_TYPE_EHRPD:
        case TelephonyManager.NETWORK_TYPE_HSPAP:
          promise.resolve(CellularGeneration.CG_3G.getValue());
        case TelephonyManager.NETWORK_TYPE_LTE:
          promise.resolve(CellularGeneration.CG_4G.getValue());
        default:
          promise.resolve(CellularGeneration.UNKNOWN.getValue());
      }
    } catch (Exception e) {
      promise.reject("ERR_CELLULAR_GENERATION_UNKNOWN_NETWORK_TYPE", "Unable to access network type or not connected to a cellular network", e);
    }
  }
}
