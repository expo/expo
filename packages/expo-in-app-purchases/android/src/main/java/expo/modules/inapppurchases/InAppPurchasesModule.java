package expo.modules.inapppurchases;

import java.util.HashMap;
import java.util.Map;
import java.util.List;

import android.content.Context;
import android.app.Activity;

import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.Purchase;

import org.unimodules.core.ExportedModule;
import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.Promise;
import org.unimodules.core.interfaces.ExpoMethod;
import org.unimodules.core.interfaces.ActivityProvider;
import org.unimodules.core.interfaces.ModuleRegistryConsumer;
import org.unimodules.core.interfaces.services.EventEmitter;

public class InAppPurchasesModule extends ExportedModule implements ModuleRegistryConsumer {
  private static final String TAG = InAppPurchasesModule.class.getSimpleName();
  private static final String NAME = "ExpoInAppPurchases";

  private BillingManager mBillingManager;
  private ModuleRegistry mModuleRegistry;
  private EventEmitter mEventEmitter;

  public InAppPurchasesModule(Context context) {
    super(context);
  }

  @Override
  public String getName() {
    return NAME;
  }

  @Override
  public void setModuleRegistry(ModuleRegistry moduleRegistry) {
    mModuleRegistry = moduleRegistry;
  }

  @Override
  public Map<String, Object> getConstants() {
    Map<String, Object> constants = new HashMap<>();

    constants.put("responseCodes", getBillingResponseCodes());
    constants.put("purchaseStates", getPurchaseStates());

    return constants;
  }

  @ExpoMethod
  public void connectToAppStoreAsync(final Promise promise) {
    Activity activity = getCurrentActivity();
    mEventEmitter = mModuleRegistry.getModule(EventEmitter.class);
    mBillingManager = new BillingManager(activity, mEventEmitter);
    mBillingManager.startConnectionAndQueryHistory(promise);
  }

  @ExpoMethod
  public void queryPurchasableItemsAsync(String billingType, List<String> itemList, final Promise promise) {
    mBillingManager.queryPurchasableItems(itemList, billingType, promise);
  }

  @ExpoMethod
  public void initiatePurchaseFlowAsync(String skuId, String oldSku, final Promise promise) {
    mBillingManager.initiatePurchaseFlow(skuId, oldSku, promise);
  }

  @ExpoMethod
  public void getBillingResponseCodeAsync(final Promise promise) {
    promise.resolve(mBillingManager.getBillingClientResponseCode());
  }

  @ExpoMethod
  public void acknowledgePurchaseAsync(String purchaseToken, final Promise promise) {
    mBillingManager.acknowledgePurchaseAsync(purchaseToken);
    promise.resolve(null);
  }

  @ExpoMethod
  public void consumeAsync(String purchaseToken, final Promise promise) {
    mBillingManager.consumeAsync(purchaseToken);
    promise.resolve(null);
  }

  @ExpoMethod
  public void disconnectAsync(final Promise promise) {
    if (mBillingManager != null) {
      mBillingManager.destroy();
    }
    promise.resolve(null);
  }

  private Activity getCurrentActivity() {
    ActivityProvider activityProvider = mModuleRegistry.getModule(ActivityProvider.class);
    return activityProvider.getCurrentActivity();
  }

  private Map<String, Integer> getBillingResponseCodes() {
    Map<String, Integer> responseCodes = new HashMap<>();

    responseCodes.put("BILLING_UNAVAILABLE", BillingClient.BillingResponseCode.BILLING_UNAVAILABLE);
    responseCodes.put("DEVELOPER_ERROR", BillingClient.BillingResponseCode.DEVELOPER_ERROR);
    responseCodes.put("ERROR", BillingClient.BillingResponseCode.ERROR);
    responseCodes.put("FEATURE_NOT_SUPPORTED", BillingClient.BillingResponseCode.FEATURE_NOT_SUPPORTED);
    responseCodes.put("ITEM_ALREADY_OWNED", BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED);
    responseCodes.put("ITEM_NOT_OWNED", BillingClient.BillingResponseCode.ITEM_NOT_OWNED);
    responseCodes.put("ITEM_UNAVAILABLE", BillingClient.BillingResponseCode.ITEM_UNAVAILABLE);
    responseCodes.put("OK", BillingClient.BillingResponseCode.OK);
    responseCodes.put("SERVICE_DISCONNECTED", BillingClient.BillingResponseCode.SERVICE_DISCONNECTED);
    responseCodes.put("SERVICE_TIMEOUT", BillingClient.BillingResponseCode.SERVICE_TIMEOUT);
    responseCodes.put("SERVICE_UNAVAILABLE", BillingClient.BillingResponseCode.SERVICE_UNAVAILABLE);
    responseCodes.put("USER_CANCELED", BillingClient.BillingResponseCode.USER_CANCELED);

    return responseCodes;
  }

  private Map<String, Integer> getPurchaseStates() {
    Map<String, Integer> purchaseState = new HashMap<>();

    purchaseState.put("PENDING", Purchase.PurchaseState.PENDING);
    purchaseState.put("PURCHASED", Purchase.PurchaseState.PURCHASED);
    purchaseState.put("UNSPECIFIED_STATE", Purchase.PurchaseState.UNSPECIFIED_STATE);

    return purchaseState;
  }

}
