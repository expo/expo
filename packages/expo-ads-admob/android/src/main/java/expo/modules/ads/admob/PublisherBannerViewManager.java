package expo.modules.ads.admob;

import android.content.Context;

import java.util.ArrayList;
import java.util.List;

import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.ViewManager;
import org.unimodules.core.interfaces.ExpoProp;
import org.unimodules.core.interfaces.ModuleRegistryConsumer;
import org.unimodules.core.interfaces.services.EventEmitter;

public class PublisherBannerViewManager extends ViewManager<PublisherBannerView>
    implements ModuleRegistryConsumer {
  public enum Events {
    EVENT_SIZE_CHANGE("onSizeChange"),
    EVENT_RECEIVE_AD("onAdViewDidReceiveAd"),
    EVENT_ERROR("onDidFailToReceiveAdWithError"),
    EVENT_WILL_PRESENT("onAdViewWillPresentScreen"),
    EVENT_WILL_DISMISS("onAdViewWillDismissScreen"),
    EVENT_DID_DISMISS("onAdViewDidDismissScreen"),
    EVENT_WILL_LEAVE_APP("onAdViewWillLeaveApplication"),
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
  public static final String PROP_TEST_DEVICE_ID = "testDeviceID";

  private EventEmitter mEventEmitter;

  @Override
  public String getName() {
    return "ExpoAdsPublisherBannerView";
  }

  @Override
  public void setModuleRegistry(ModuleRegistry moduleRegistry) {
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
    for(AdMobBannerViewManager.Events event : AdMobBannerViewManager.Events.values()) {
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

  @ExpoProp(name = PROP_TEST_DEVICE_ID)
  public void setPropTestDeviceID(PublisherBannerView view, final String testDeviceID) {
    view.setPropTestDeviceID(testDeviceID);
  }
}
