package abi44_0_0.expo.modules.ads.facebook;

import android.content.Context;
import android.os.Bundle;
import android.view.View;

import com.facebook.ads.AdError;
import com.facebook.ads.MediaView;
import com.facebook.ads.NativeAdsManager;

import abi44_0_0.expo.modules.core.ModuleRegistry;
import abi44_0_0.expo.modules.core.Promise;
import abi44_0_0.expo.modules.core.interfaces.InternalModule;
import abi44_0_0.expo.modules.core.interfaces.services.EventEmitter;
import abi44_0_0.expo.modules.core.interfaces.services.UIManager;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class NativeAdManager implements InternalModule {
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
  public void onCreate(ModuleRegistry moduleRegistry) {
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

        adsManager.setListener(new NativeAdsManager.Listener() {
          /**
           * Called when one of the registered ads managers loads ads. Sends state of all
           * managers back to JS
           */
          @Override
          public void onAdsLoaded() {
            Bundle adsManagersState = new Bundle();

            for (String key : mAdsManagers.keySet()) {
              NativeAdsManager adsManager = mAdsManagers.get(key);
              adsManagersState.putBoolean(key, adsManager != null && adsManager.isLoaded());
            }

            sendAppEvent("CTKNativeAdsManagersChanged", adsManagersState);
          }

          /**
           * Called when one of the registered ads managers encounters an error. Sends the error
           * and the specific placementId for which manager errored to JS.
           */
          @Override
          public void onAdError(AdError adError) {
            // @todo handle errors here
            Bundle error = new Bundle();
            error.putInt("code", adError.getErrorCode());
            error.putString("message", adError.getErrorMessage());

            Bundle state = new Bundle();
            state.putString("placementId", placementId);
            state.putBundle("error", error);

            sendAppEvent("CTKNativeAdManagerErrored", state);
          }
        });

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
          MediaView adIconView = null;

          if (adTag != -1) {
            nativeAdView = (NativeAdView) viewHolder.get(adTag);
          }

          if (mediaViewTag != -1) {
            mediaView = (MediaView) viewHolder.get(mediaViewTag);
          }

          if (adIconViewTag != -1) {
            adIconView = (MediaView) viewHolder.get(adIconViewTag);
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
