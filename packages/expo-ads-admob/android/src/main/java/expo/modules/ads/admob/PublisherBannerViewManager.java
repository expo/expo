package expo.modules.ads.admob;

import android.content.Context;

import expo.modules.core.ModuleRegistry;
import expo.modules.core.ViewManager;
import expo.modules.core.arguments.ReadableArguments;
import expo.modules.core.interfaces.ExpoProp;
import expo.modules.core.interfaces.services.EventEmitter;

import java.util.ArrayList;
import java.util.List;

public class PublisherBannerViewManager extends ViewManager<PublisherBannerView> {
  public enum Events {
    EVENT_SIZE_CHANGE("onSizeChange"),
    EVENT_RECEIVE_AD("onAdViewDidReceiveAd"),
    EVENT_ERROR("onDidFailToReceiveAdWithError"),
    EVENT_WILL_PRESENT("onAdViewWillPresentScreen"),
    EVENT_WILL_DISMISS("onAdViewWillDismissScreen"),
    EVENT_DID_DISMISS("onAdViewDidDismissScreen"),
    EVENT_ADMOB_EVENT_RECEIVED("onAdmobDispatchAppEvent");

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
    return "ExpoAdsPublisherBannerView";
  }

  @Override
  public void onCreate(ModuleRegistry moduleRegistry) {
    mEventEmitter = moduleRegistry.getModule(EventEmitter.class);
  }

  @Override
  public PublisherBannerView createViewInstance(Context context) {
    return new PublisherBannerView(context, mEventEmitter);
  }

  @Override
  public ViewManagerType getViewManagerType() {
    return ViewManagerType.GROUP;
  }

  @Override
  public List<String> getExportedEventNames() {
    List<String> eventNames = new ArrayList<>(AdMobBannerViewManager.Events.values().length);
    for (AdMobBannerViewManager.Events event : AdMobBannerViewManager.Events.values()) {
      eventNames.add(event.toString());
    }
    return eventNames;
  }

  @ExpoProp(name = PROP_BANNER_SIZE)
  public void setBannerSize(PublisherBannerView view, final String sizeString) {
    view.setBannerSize(sizeString);
  }

  @ExpoProp(name = PROP_AD_UNIT_ID)
  public void setAdUnitID(PublisherBannerView view, final String adUnitID) {
    view.setAdUnitID(adUnitID);
  }

  @ExpoProp(name = PROP_ADDITIONAL_REQUEST_PARAMS)
  public void setPropAdditionalRequestParams(PublisherBannerView view, final ReadableArguments additionalRequestParams) {
    view.setAdditionalRequestParams(additionalRequestParams.toBundle());
  }
}
