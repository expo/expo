import { Platform } from '@unimodules/core';
import Constants from 'expo-constants';

type JSFirebaseAnalyticsCodedEvent = { [key: string]: any };

interface JSFirebaseAnalyticsOptions {
  maxCacheTime: number;
  strictNativeEmulation: boolean;
}

function encodeQueryArgs(queryArgs: JSFirebaseAnalyticsCodedEvent): string {
  const now = Date.now();
  return Object.keys(queryArgs)
    .map(key => {
      return `${key}=${encodeURIComponent(
        key === '_et' ? Math.max(now - queryArgs[key], 0) : queryArgs[key]
      )}`;
    })
    .join('&');
}

/**
 * A basic & lightweight Google Analytics tracker that uses
 * HTTPS Measurement API 2 to send events to Google Analytics.
 *
 * The tracker-class supports an API that is very similar to the Firebase Analytics &
 * gtag api. This makes it possible to use this class as a substitute tracker, for
 * instance on react-native environments that don't support gtag or its dependencies.
 */
class JSFirebaseAnalytics {
  public readonly url: string;
  private enabled: boolean;
  public readonly trackingId: string;
  private clientId: string;
  private userId?: string;
  private userProperties?: { [key: string]: any };
  private screenName?: string;
  private eventQueue = new Set<JSFirebaseAnalyticsCodedEvent>();
  private options: JSFirebaseAnalyticsOptions;
  private flushEventsPromise: Promise<void> = Promise.resolve();
  private flushEventsTimer: any;

  static SHORT_EVENT_PARAMS = {
    currency: 'cu',
  };

  constructor(trackingId: string, options?: JSFirebaseAnalyticsOptions) {
    this.url = 'https://www.google-analytics.com/g/collect';
    this.enabled = true;

    // The tracking ID / web property ID. The format is G-XXXXXXXX.
    // All collected data is associated by this ID.
    this.trackingId = trackingId;

    // The clientId anonymously identifies a particular user, device, or browser instance.
    // For the web, this is generally stored as a first-party cookie with a two-year expiration.
    // For mobile apps, this is randomly generated for each particular instance of an application install.
    // The value of this field should be a random UUID (version 4) as described in http://www.ietf.org/rfc/rfc4122.txt.
    //this.clientId = Constants.installationId;
    // TODO
    this.clientId = '225648371.1580903706';

    // Set the options
    this.options = {
      maxCacheTime: 5000,
      strictNativeEmulation: false,
    };
    if (options) {
      this.options = {
        ...this.options,
        ...options,
      };
    }
  }

  /**
   * Sends 1 or more coded-events to the back-end.
   * When only 1 event is provided, it is send inside the query URL.
   * When more than 1 event is provided, the event-data is send in
   * the body of the POST request.
   */
  private async send(events: Set<JSFirebaseAnalyticsCodedEvent>): Promise<void> {
    let queryArgs = {
      v: 2,
      tid: this.trackingId,
      cid: this.clientId,
      /*
      gtm: 2oe250
      _p: 769479815
      sr: 3440x1440
      ul: en-us
      _fid: cfZrCTjKgXnSjj4N_Bwtgx
      cid: 225648371.1580903706
      dl: http://10.10.200.202/
      dr: http://10.10.200.202:19006/
      dt: expo-firebase-demo
      sid: 1581606982
      sct: 8
      seg: 1
      _s: 1
      */
      //ul: 'en-us',
      //an: 'Expo Client',
      //av: '1.2',
      //ds: 'app',
      //aid: '',
      //_fid:
    };
    let body;

    if (events.size > 1) {
      body = '';
      events.forEach(event => {
        body += encodeQueryArgs(event) + '\n';
      });
    } else if (events.size === 1) {
      const event = events.values().next().value;
      queryArgs = {
        ...event,
        ...queryArgs,
      };
    }
    const args = encodeQueryArgs(queryArgs);
    console.log(`GATracker: ${args}...`);
    const response = await fetch(`${this.url}?${args}`, {
      method: 'POST',
      cache: 'no-cache',
      body,
    });
    console.log(`GATracker: response: ${response.status}`);
  }

  private async addEvent(event: JSFirebaseAnalyticsCodedEvent) {
    const { userId, userProperties, screenName } = this;

    // Extend the event with the currently set User-id
    if (userId) event.uid = userId;

    // Add user-properties
    if (userProperties) {
      for (let name in userProperties) {
        event[name] = userProperties[name];
      }

      // Reset user-properties after the first event. This is what gtag.js seems
      // to do as well, although I couldn't find any docs explaining this behavior.
      this.userProperties = undefined;
    }

    // Add the event to the queue
    this.eventQueue.add(event);

    // Start debounce timer
    if (!this.flushEventsTimer) {
      this.flushEventsTimer = setTimeout(async () => {
        this.flushEventsTimer = undefined;
        try {
          await this.flushEventsPromise;
        } catch (err) {
          // nop
        }
        this.flushEventsPromise = this.flushEvents();
      }, this.options.maxCacheTime);
    }
  }

  private async flushEvents() {
    if (!this.eventQueue.size) return;
    const events = new Set<JSFirebaseAnalyticsCodedEvent>(this.eventQueue);
    await this.send(events);
    events.forEach(event => this.eventQueue.delete(event));
  }

  /**
   * Clears any queued events and cancels the flush timer.
   */
  clearEvents() {
    this.eventQueue.clear();
    if (this.flushEventsTimer) {
      clearTimeout(this.flushEventsTimer);
      this.flushEventsTimer = 0;
    }
  }

  /**
   * Parses an event (as passed to logEvent) and throws an error when the
   * event-name or parameters are invalid.
   *
   * Upon success, returns the event in encoded format, ready to be send
   * through the Google Measurement API v2.
   */
  static parseEvent(
    eventName: string,
    eventParams?: { [key: string]: any }
  ): JSFirebaseAnalyticsCodedEvent {
    if (
      !eventName ||
      !eventName.length ||
      eventName.length > 40 ||
      eventName[0] === '_' ||
      !eventName.match(/^[A-Za-z_]+$/) ||
      eventName.startsWith('firebase_') ||
      eventName.startsWith('google_') ||
      eventName.startsWith('ga_')
    ) {
      throw new Error(
        'Invalid event-name specified. Should contain 1 to 40 alphanumeric characters or underscores. The name must start with an alphabetic character.'
      );
    }
    const params: JSFirebaseAnalyticsCodedEvent = {
      en: eventName,
      _et: Date.now(),
      'ep.origin': 'firebase',
    };
    if (eventParams) {
      for (let key in eventParams) {
        const paramKey =
          JSFirebaseAnalytics.SHORT_EVENT_PARAMS[key] ||
          (typeof eventParams[key] === 'number' ? `epn.${key}` : `ep.${key}`);
        params[paramKey] = eventParams[key];
      }
    }
    return params;
  }

  /**
   * Parses user-properties (as passed to setUserProperties) and throws an error when
   * one of the user properties is invalid.
   *
   * Upon success, returns the user-properties in encoded format, ready to be send
   * through the Google Measurement API v2.
   */
  static parseUserProperty(
    userPropertyName: string,
    userPropertyValue: any,
    options: JSFirebaseAnalyticsOptions
  ): string {
    if (
      !userPropertyName.length ||
      userPropertyName.length > 24 ||
      userPropertyName[0] === '_' ||
      !userPropertyName.match(/^[A-Za-z_]+$/) ||
      userPropertyName.startsWith('firebase_') ||
      userPropertyName.startsWith('google_') ||
      userPropertyName.startsWith('ga_')
    ) {
      throw new Error(
        'Invalid user-property name specified. Should contain 1 to 24 alphanumeric characters or underscores. The name must start with an alphabetic character.'
      );
    }
    if (
      userPropertyValue !== undefined &&
      userPropertyValue !== null &&
      options.strictNativeEmulation &&
      (typeof userPropertyValue !== 'string' || userPropertyValue.length > 36)
    ) {
      throw new Error(
        'Invalid user-property value specified. Value should be a string of up to 36 characters long.'
      );
    }
    return typeof userPropertyValue === 'number'
      ? `upn.${userPropertyName}`
      : `up.${userPropertyName}`;
  }

  /**
   * https://firebase.google.com/docs/reference/js/firebase.analytics.Analytics#log-event
   */
  async logEvent(eventName: string, eventParams?: { [key: string]: any }): Promise<void> {
    console.log('logEvent: ', eventName, eventParams);
    const event = JSFirebaseAnalytics.parseEvent(eventName, eventParams);
    if (!this.enabled) return;
    return this.addEvent(event);
  }

  /**
   * https://firebase.google.com/docs/reference/js/firebase.analytics.Analytics#set-analytics-collection-enabled
   */
  async setAnalyticsCollectionEnabled(isEnabled: boolean): Promise<void> {
    this.enabled = isEnabled;
  }

  /**
   * https://firebase.google.com/docs/reference/js/firebase.analytics.Analytics#set-current-screen
   */
  async setCurrentScreen(screenName?: string, screenClassOverride?: string): Promise<void> {
    if (!this.enabled) return;
    const isChanged = this.screenName !== screenName;
    this.screenName = screenName || undefined;
    // https://developers.google.com/analytics/devguides/collection/analyticsjs/screens
    if (isChanged) {
      await this.logEvent('screenview');
    }
  }

  /**
   * https://firebase.google.com/docs/reference/js/firebase.analytics.Analytics#set-user-id
   */
  async setUserId(userId: string | null): Promise<void> {
    if (!this.enabled) return;
    this.userId = userId || undefined;
  }

  /**
   * https://firebase.google.com/docs/reference/js/firebase.analytics.Analytics#set-user-properties
   */
  async setUserProperties(userProperties: { [key: string]: any }): Promise<void> {
    if (!this.enabled) return;
    console.log(`setUserProperties: ${userProperties}`);
    for (let name in userProperties) {
      const val = userProperties[name];
      const key = JSFirebaseAnalytics.parseUserProperty(name, val, this.options);
      if (val === null || val === undefined) {
        if (this.userProperties) {
          delete this.userProperties[key];
        }
      } else {
        this.userProperties = this.userProperties || {};
        this.userProperties[key] = val;
      }
    }
  }
}

export default JSFirebaseAnalytics;
