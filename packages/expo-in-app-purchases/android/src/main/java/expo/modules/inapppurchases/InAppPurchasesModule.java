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

public class InAppPurchasesModule extends ExportedModule implements ModuleRegistryConsumer {
  private static final String TAG = InAppPurchasesModule.class.getSimpleName();
  private static final String NAME = "ExpoInAppPurchases";

  private BillingManager mBillingManager;
  private ModuleRegistry mModuleRegistry;

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

    constants.put("purchaseStates", getPurchaseStates());

    return constants;
  }

  @ExpoMethod
  public void connectAsync(final Promise promise) {
    Activity activity = getCurrentActivity();
    if (activity == null) {
      promise.reject("E_ACTIVITY_UNAVAILABLE", "Activity is not available");
    }
    mBillingManager = new BillingManager(activity);
    mBillingManager.startConnectionAndQueryHistory(promise);
  }

  @ExpoMethod
  public void getProductsAsync(List<String> itemList, final Promise promise) {
    mBillingManager.queryPurchasableItems(itemList, promise);
  }

  @ExpoMethod
  public void getPurchaseHistoryAsync(Boolean refresh, final Promise promise) {
    if (refresh != null && refresh) {
      // Makes a network request and provides more detailed information
      mBillingManager.queryPurchaseHistoryAsync(promise);
    } else {
      mBillingManager.queryPurchases(promise);
    }
  }

  @ExpoMethod
  public void purchaseItemAsync(String skuId, String oldSku, final Promise promise) {
    mBillingManager.purchaseItemAsync(skuId, oldSku, promise);
  }

  @ExpoMethod
  public void getBillingResponseCodeAsync(final Promise promise) {
    promise.resolve(mBillingManager.getBillingClientResponseCode());
  }

  @ExpoMethod
  public void acknowledgePurchaseAsync(String purchaseToken, final Promise promise) {
    mBillingManager.acknowledgePurchaseAsync(purchaseToken, promise);
  }

  @ExpoMethod
  public void consumeAsync(String purchaseToken, final Promise promise) {
    mBillingManager.consumeAsync(purchaseToken, promise);
  }

  @ExpoMethod
  public void disconnectAsync(final Promise promise) {
    if (mBillingManager != null) {
      mBillingManager.destroy();
      mBillingManager = null;
    }
    promise.resolve(null);
  }

  private Activity getCurrentActivity() {
    ActivityProvider activityProvider = mModuleRegistry.getModule(ActivityProvider.class);
    return activityProvider != null ? activityProvider.getCurrentActivity() : null;
  }

  private Map<String, Integer> getPurchaseStates() {
    Map<String, Integer> purchaseState = new HashMap<>();

    purchaseState.put("PENDING", Purchase.PurchaseState.PENDING);
    purchaseState.put("PURCHASED", Purchase.PurchaseState.PURCHASED);
    purchaseState.put("UNSPECIFIED_STATE", Purchase.PurchaseState.UNSPECIFIED_STATE);

    return purchaseState;
  }

}
