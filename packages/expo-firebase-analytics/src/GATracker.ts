import { Platform } from '@unimodules/core';
import Constants from 'expo-constants';

const EVENTS = {
  add_payment_info: { category: 'ecommerce' },
  add_to_cart: { category: 'ecommerce' },
  add_to_wishlist: { category: 'ecommerce' },
  begin_checkout: { category: 'ecommerce' },
  checkout_progress: { category: 'ecommerce' },
  generate_lead: { category: 'engagement' },
  login: { category: 'engagement', method: 'el' },
  purchase: { category: 'ecommerce' },
  refund: { category: 'ecommerce' },
  remove_from_cart: { category: 'ecommerce' },
  search: { category: 'engagement', search_term: 'el' },
  select_content: { category: 'engagement', content_type: 'el' },
  set_checkout_option: { category: 'ecommerce' },
  share: { category: 'engagement', method: 'el' },
  sign_up: { category: 'engagement', method: 'el' },
  view_item: { category: 'engagement' },
  view_item_list: { category: 'engagement' },
  view_promotion: { category: 'engagement' },
  view_search_results: { category: 'engagement', search_term: 'el' },

  // TODO CATEGORY
  //timing_complete: { category: 'engagement' },
  //page_view: { category: 'engagement' },
  //screen_view: { category: 'engagement' },
  //exception: { category: 'engagement' },
};

interface MeasurementEventType {
  ec: string; // Event Category
  ea: string; // Event Action
  el?: string; // Event Label
  ev?: number; // Event value
}

/**
 * Converts Firebase event-names & parameters into Measurement
 * parameters that can be consumed by the Google Measurement API.
 */
function eventToMeasurementParams(name: string, params?: { [key: string]: any }): any {
  // TODO
  return {};
}

/**
 * A basic & lightweight Google Analytics tracker that uses the HTTPS Measurement API
 * to send events to Google Analytics.
 *
 * The tracker-class supports an API that is very similar to the Firebase Analytics &
 * gtag api. This makes it possible to use this class as a substitute tracker, for
 * instance on react-native environments that don't support gtag or its dependencies.
 */
class GATracker {
  public readonly url: string;
  private enabled: boolean;
  public readonly trackingId: string;
  private clientId: string;

  constructor(trackingId: string) {
    this.url = 'https://www.google-analytics.com/g/collect';
    this.enabled = true;

    // The tracking ID / web property ID. The format is UA-XXXX-Y.
    // All collected data is associated by this ID.
    this.trackingId = trackingId;

    // The clientId anonymously identifies a particular user, device, or browser instance.
    // For the web, this is generally stored as a first-party cookie with a two-year expiration.
    // For mobile apps, this is randomly generated for each particular instance of an application install.
    // The value of this field should be a random UUID (version 4) as described in http://www.ietf.org/rfc/rfc4122.txt.
    //this.clientId = Constants.installationId;
    this.clientId = '225648371.1580903706';
  }

  private async send(type: string, params: { [key: string]: any }): Promise<void> {
    params = params || {};
    /*if (!params.v) params.v = 1;
    if (!params.tid) params.tid = this.trackingId;
    if (!params.sid) params.sid = this.clientId;
    if (!params.t) params.t = type;
    if (!params.ds) params.ds = Platform.OS === 'web' ? 'web' : 'app';
    if (!params.an) params.an = 'Expo Client';
    //if (!params.aid) params.aid = Platform.OS === 'web' ? 'web' : 'app';
    if (!params.av) params.av = '1.2';
    //if (!params.aiid) params.aiid = Platform.OS === 'web' ? 'web' : 'app';

    // an : App name (My App)
    // aid : Applidation id (com.company.app)
    // av: Application version (1.2)
    // aiid: Application installer id (com.platform.vending)*/

    params = {
      v: 2,
      tid: this.trackingId,
      cid: this.clientId,
      en: 'event_name',
      'ep.foo': 'bar',
      //ul: 'en-us',
      //an: 'Expo Client',
      //av: '1.2',
      //ds: 'app',
      //aid: '',
      //_fid:
      //...params,
    };

    const args = Object.keys(params)
      .map(key => {
        return `${key}=${encodeURIComponent(params[key])}`;
      })
      .join('&');
    console.log(`GATracker: ${args}...`);
    /*const response = await fetch(this.url, {
      method: 'POST',
      cache: 'no-cache',
      body: args,
    });*/
    const response = await fetch(`${this.url}?${args}`, {
      method: 'POST',
      cache: 'no-cache',
    });
    console.log(`GATracker: response: ${response.status}`);
  }

  private async setProperties(props: any): Promise<void> {
    // TODO
  }

  logEvent(eventName: string, eventParams?: { [key: string]: any }): Promise<void> {
    switch (eventName) {
      case 'exception':
        return this.send('exception', {}); // TODO PARAMS?
      default:
        return this.send('event', eventToMeasurementParams(eventName, eventParams));
    }
  }

  async setAnalyticsCollectionEnabled(isEnabled: boolean): Promise<void> {
    this.enabled = isEnabled;
  }

  async setCurrentScreen(screenName?: string, screenClassOverride?: string): Promise<void> {
    // LOG SCREENVIEW?
    // https://developers.google.com/analytics/devguides/collection/analyticsjs/screens
    /*await this.send('screenview', {
      cd: screenName,
    });*/
    return this.setProperties({
      screen_name: screenName,
    });
  }

  async setUserId(userId: string | null): Promise<void> {
    return this.setProperties({
      user_id: userId,
    });
  }

  async setUserProperties(userProperties: { [key: string]: any }): Promise<void> {
    return this.setProperties({
      user_properties: userProperties,
    });
  }
}

export default GATracker;
