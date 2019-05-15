package expo.modules.inapppurchases;

import java.util.Map;

import android.content.Context;
import android.util.Log;

import org.unimodules.core.ExportedModule;
import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.Promise;
import org.unimodules.core.interfaces.ExpoMethod;
import org.unimodules.core.interfaces.ModuleRegistryConsumer;

public class InAppPurchasesModule extends ExportedModule implements ModuleRegistryConsumer {
  private static final String TAG = InAppPurchasesModule.class.getSimpleName();
  private static final String NAME = "ExpoInAppPurchases";
  //private BillingClient billingClient;

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

  @ExpoMethod
  public void connectToAppStoreAsync(Map<String, Object> options, final Promise promise) {
    Log.d(TAG, "Calling connectToAppStoreAsync from native");
    // TODO: actually start implementing it.
    // But first try the native API and test app.
    promise.resolve(null);
    /*
    billingClient = BillingClient.newBuilder(activity).setListener(this).build();
    billingClient.startConnection(new BillingClientStateListener() {
      @Override
      public void onBillingSetupFinished(BillingResult billingResult) {
          if (billingResult.getResponseCode() == BillingResponse.OK) {
              // The BillingClient is ready. You can query purchases here.
          }
      }
      @Override
      public void onBillingServiceDisconnected() {
          // Try to restart the connection on the next request to
          // Google Play by calling the startConnection() method.
      }
    });
    */
  }
}
