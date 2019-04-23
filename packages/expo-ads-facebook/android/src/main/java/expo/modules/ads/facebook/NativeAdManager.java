package expo.modules.ads.facebook;

import android.content.Context;
import android.os.Bundle;
import android.view.View;

import com.facebook.ads.AdError;
import com.facebook.ads.AdIconView;
import com.facebook.ads.MediaView;
import com.facebook.ads.NativeAdsManager;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.Promise;
import org.unimodules.core.interfaces.InternalModule;
import org.unimodules.core.interfaces.ModuleRegistryConsumer;
import org.unimodules.core.interfaces.services.EventEmitter;
import org.unimodules.core.interfaces.services.UIManager;

public class NativeAdManager implements InternalModule, NativeAdsManager.Listener, ModuleRegistryConsumer {
  /**
   * @{Map} with all registered fb ads managers
   **/
  private Map<String, NativeAdsManager> mAdsManagers = new HashMap<>();
  private ModuleRegistry mModuleRegistry;
  private Context mContext;

  public NativeAdManager(Context context) {
    mContext = context;
  }

  @Override
  public List<Class> getExportedInterfaces() {
    return Collections.singletonList((Class) NativeAdManager.class);
  }

  @Override
  public void setModuleRegistry(ModuleRegistry moduleRegistry) {
    mModuleRegistry = moduleRegistry;
  }

  /**
   * Initialises native ad manager for a given placement id and ads to request.
   * This method is run on the UI thread
   *
   * @param placementId
   * @param adsToRequest
   */
  public void init(final String placementId, final int adsToRequest, final Promise promise) {
    mModuleRegistry.getModule(UIManager.class).runOnUiQueueThread(new Runnable() {
      @Override
      public void run() {
        final NativeAdsManager adsManager = new NativeAdsManager(mContext, placementId, adsToRequest);

        adsManager.setListener(NativeAdManager.this);

        mAdsManagers.put(placementId, adsManager);

        adsManager.loadAds();
        promise.resolve(null);
      }
    });
  }

  /**
   * Disables auto refresh
   *
   * @param placementId
   */
  public void disableAutoRefresh(String placementId, Promise promise) {
    mAdsManagers.get(placementId).disableAutoRefresh();
    promise.resolve(null);
  }

  /**
   * Called when one of the registered ads managers loads ads. Sends state of all
   * managers back to JS
   */
  @Override
  public void onAdsLoaded() {
    Bundle adsManagersState = new Bundle();

    for (String key : mAdsManagers.keySet()) {
      NativeAdsManager adsManager = mAdsManagers.get(key);
      adsManagersState.putBoolean(key, adsManager.isLoaded());
    }

    sendAppEvent("CTKNativeAdsManagersChanged", adsManagersState);
  }

  @Override
  public void onAdError(AdError adError) {
    // @todo handle errors here
  }

  /**
   * Returns FBAdsManager for a given placement id
   *
   * @param placementId
   * @return
   */
  public NativeAdsManager getFBAdsManager(String placementId) {
    return mAdsManagers.get(placementId);
  }

  /**
   * Helper for sending events back to Javascript.
   *
   * @param eventName
   * @param params
   */
  private void sendAppEvent(String eventName, Bundle params) {
    mModuleRegistry.getModule(EventEmitter.class).emit(eventName, params);
  }

  public void triggerEvent(final int nativeAdView, final Promise promise) {
    mModuleRegistry.getModule(UIManager.class).addUIBlock(nativeAdView, new UIManager.UIBlock<NativeAdView>() {
      @Override
      public void resolve(NativeAdView view) {
        view.triggerClick();
        promise.resolve(null);
      }

      @Override
      public void reject(Throwable throwable) {
        promise.reject("E_NO_NATIVE_AD_VIEW", throwable);
      }
    }, NativeAdView.class);
  }

  public void registerViewsForInteraction(final int adTag,
                                          final int mediaViewTag,
                                          final int adIconViewTag,
                                          final List<Object> clickableViewsTags,
                                          final Promise promise) {
    mModuleRegistry.getModule(UIManager.class).addUIBlock(new UIManager.GroupUIBlock() {
      @Override
      public void execute(UIManager.ViewHolder viewHolder) {
        try {
          NativeAdView nativeAdView = null;
          MediaView mediaView = null;
          AdIconView adIconView = null;

          if (adTag != -1) {
            nativeAdView = (NativeAdView) viewHolder.get(adTag);
          }

          if (mediaViewTag != -1) {
            mediaView = (MediaView) viewHolder.get(mediaViewTag);
          }

          if (adIconViewTag != -1) {
            adIconView = (AdIconView) viewHolder.get(adIconViewTag);
          }

          List<View> clickableViews = new ArrayList<>();
          for (Object clickableViewTag : clickableViewsTags) {
            clickableViews.add(viewHolder.get(clickableViewTag));
          }
          nativeAdView.registerViewsForInteraction(mediaView, adIconView, clickableViews);
          promise.resolve(null);

        } catch (ClassCastException e) {
          promise.reject("E_CANNOT_CAST", e);
        } catch (NullPointerException e) {
          promise.reject("E_NO_NATIVE_AD_VIEW", e);
        } catch (Exception e) {
          promise.reject("E_AD_REGISTER_ERROR", e);
        }
      }
    });
  }
}
