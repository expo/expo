package expo.modules.ads.admob;

import android.content.Context;

import expo.modules.core.ModuleRegistry;
import expo.modules.core.ViewManager;
import expo.modules.core.arguments.ReadableArguments;
import expo.modules.core.interfaces.ExpoProp;
import expo.modules.core.interfaces.services.EventEmitter;

import java.util.ArrayList;
import java.util.List;

public class AdMobBannerViewManager extends ViewManager<AdMobBannerView> {
  public enum Events {
    EVENT_SIZE_CHANGE("onSizeChange"),
    EVENT_RECEIVE_AD("onAdViewDidReceiveAd"),
    EVENT_ERROR("onDidFailToReceiveAdWithError"),
    EVENT_WILL_PRESENT("onAdViewWillPresentScreen"),
    EVENT_WILL_DISMISS("onAdViewWillDismissScreen"),
    EVENT_DID_DISMISS("onAdViewDidDismissScreen");

    private final String mName;

    Events(final String name) {
      mName = name;
    }

    @Override
    public String toString() {
      return mName;
    }
  }

  public static final String PROP_BANNER_SIZE = "bannerSize";
  public static final String PROP_AD_UNIT_ID = "adUnitID";
  public static final String PROP_ADDITIONAL_REQUEST_PARAMS = "additionalRequestParams";

  private EventEmitter mEventEmitter;

  @Override
  public String getName() {
    return "ExpoAdsAdMobBannerView";
  }

  @Override
  public void onCreate(ModuleRegistry moduleRegistry) {
    mEventEmitter = moduleRegistry.getModule(EventEmitter.class);
  }

  @Override
  public AdMobBannerView createViewInstance(Context context) {
    return new AdMobBannerView(context, mEventEmitter);
  }

  @Override
  public ViewManagerType getViewManagerType() {
    return ViewManagerType.GROUP;
  }

  @Override
  public List<String> getExportedEventNames() {
    List<String> eventNames = new ArrayList<>(Events.values().length);
    for (Events event : Events.values()) {
      eventNames.add(event.toString());
    }
    return eventNames;
  }

  @ExpoProp(name = PROP_BANNER_SIZE)
  public void setBannerSize(AdMobBannerView view, final String sizeString) {
    view.setBannerSize(sizeString);
  }

  @ExpoProp(name = PROP_AD_UNIT_ID)
  public void setAdUnitID(AdMobBannerView view, final String adUnitID) {
    view.setAdUnitID(adUnitID);
  }

  @ExpoProp(name = PROP_ADDITIONAL_REQUEST_PARAMS)
  public void setPropAdditionalRequestParams(AdMobBannerView view, final ReadableArguments additionalRequestParams) {
    view.setAdditionalRequestParams(additionalRequestParams.toBundle());
  }
}
