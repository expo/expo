type FirebaseAnalyticsJSCodedEvent = { [key: string]: any };

interface FirebaseAnalyticsJSConfig {
  /**
   * **(Required)** Measurement-Id as found in the web Firebase-config.
   * The format is G-XXXXXXXXXX.
   */
  measurementId: string;
}

interface FirebaseAnalyticsJSOptions {
  /**
   * **(Required)** Anonymously identifies a particular user, device, or browser instance.
   * For the web, this is generally stored as a first-party cookie with a two-year expiration.
   * For mobile apps, this is randomly generated for each particular instance of an application install.
   * The value of this field should be a random UUID (version 4) as described in http://www.ietf.org/rfc/rfc4122.txt.
   * https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters#cid
   */
  clientId: string;

  /**
   * Max cache time in msec (default = 5000).
   * Caches events fired within a certain time-frame and then
   * sends them to the Google Measurement API in a single batch.
   */
  maxCacheTime?: number;

  /**
   * Enables strict data format checks for logEvent and setUserProperties.
   * When enabled, causes `logEvent` and `setUserProperties` to strictly check
   * whether any event- names & values and user-properties conform to the
   * native SDK requirements.
   */
  strictNativeEmulation?: boolean;

  /**
   * Document title (e.g. "My Awesome Page").
   * This is a browser specific field.
   * https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters#dt
   */
  docTitle?: string;

  /**
   * Document location URL (e.g. "https://myawesomeapp.com").
   * This is a browser specific field.
   * https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters#dl
   */
  docLocation?: string;

  /**
   * Screen-resolution in the format "WxH" (e.g "2000x1440").
   * This is a browser specific field.
   * https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters#sr
   */
  screenRes?: string;

  /**
   * Application name (e.g. "My Awesome App").
   * This is a mobile app specific field.
   * https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters#an
   */
  appName?: string;

  /**
   * Application version (e.g. "1.2").
   * This is a mobile app specific field.
   * https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters#av
   */
  appVersion?: string;

  /**
   * User language (e.g. "en-us").
   * https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters#ul
   */
  userLanguage?: string;

  /**
   * Origin (default =  "firebase").
   */
  origin?: string;

  /**
   * Custom query arguments that are appended to the POST request that is send to the
   * Google Measurement API v2.
   *
   * @example
   * ```
   * const analytics = new FirebaseAnalyticsJS(config, {
   *   appName: 'My Awesome App',
   *   customArg: {
   *     vp: '123x456', // Add viewport-size
   *     sd: '24-bits' // Add screen-colors
   *   }
   * });
   * ```
   */
  customArgs?: { [key: string]: any };
}

function encodeQueryArgs(queryArgs: FirebaseAnalyticsJSCodedEvent): string {
  const now = Date.now();
  return Object.keys(queryArgs)
    .map(key => {
      return `${key}=${encodeURIComponent(
        key === '_et' ? Math.max(now - queryArgs[key], 0) : queryArgs[key]
      )}`;
    })
    .join('&');
}

const SHORT_EVENT_PARAMS = {
  currency: 'cu',
};

/**
 * A pure JavaScript Google Firebase Analytics implementation that uses
 * the HTTPS Measurement API 2 to send events to Google Analytics.
 *
 * This class provides an alternative for the Firebase Analytics module
 * shipped with the Firebase JS SDK. That library uses the gtag.js dependency
 * and requires certain browser features. This prevents the use
 * analytics on other platforms, such as Node-js and react-native.
 *
 * FirebaseAnalyticsJS provides a bare-bone implementation of the new
 * HTTPS Measurement API 2 protocol (which is undocumented), with an API
 * that follows the Firebase Analytics JS SDK.
 */
class FirebaseAnalyticsJS {
  public readonly url: string;
  private enabled: boolean;
  public readonly config: FirebaseAnalyticsJSConfig;
  private userId?: string;
  private userProperties?: { [key: string]: any };
  private screenName?: string;
  private eventQueue = new Set<FirebaseAnalyticsJSCodedEvent>();
  private options: FirebaseAnalyticsJSOptions;
  private flushEventsPromise: Promise<void> = Promise.resolve();
  private flushEventsTimer: any;

  constructor(config: FirebaseAnalyticsJSConfig, options: FirebaseAnalyticsJSOptions) {
    // Verify the measurement- & client Ids
    if (!config.measurementId)
      throw new Error(
        'No valid measurementId. Make sure to provide a valid measurementId with a G-XXXXXXXXXX format.'
      );
    if (!options.clientId)
      throw new Error(
        'No valid clientId. Make sure to provide a valid clientId with a UUID (v4) format.'
      );

    // Initialize
    this.url = 'https://www.google-analytics.com/g/collect';
    this.enabled = true;
    this.config = config;
    this.options = {
      customArgs: {},
      maxCacheTime: 5000,
      strictNativeEmulation: false,
      origin: 'firebase',
      ...options,
    };
  }

  /**
   * Sends 1 or more coded-events to the back-end.
   * When only 1 event is provided, it is send inside the query URL.
   * When more than 1 event is provided, the event-data is send in
   * the body of the POST request.
   */
  private async send(events: Set<FirebaseAnalyticsJSCodedEvent>): Promise<void> {
    const { config, options } = this;
    let queryArgs: any = {
      ...options.customArgs,
      v: 2,
      tid: config.measurementId,
      cid: this.options.clientId,
    };
    if (options.userLanguage) queryArgs.ul = options.userLanguage;
    if (options.appName) queryArgs.an = options.appName;
    if (options.appVersion) queryArgs.av = options.appVersion;
    if (options.docTitle) queryArgs.dt = options.docTitle;
    if (options.docLocation) queryArgs.dl = options.docLocation;
    if (options.screenRes) queryArgs.sr = options.screenRes;
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
    //console.log(`FirebaseAnalyticsJS: ${args}...`);
    await fetch(`${this.url}?${args}`, {
      method: 'POST',
      cache: 'no-cache',
      body,
    });
    //console.log(`FirebaseAnalyticsJS: response: ${response.status}`);
  }

  private async addEvent(event: FirebaseAnalyticsJSCodedEvent) {
    const { userId, userProperties, screenName } = this;

    // Extend the event with the currently set User-id
    if (userId) event.uid = userId;
    if (screenName) event['ep.screen_name'] = screenName;

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
    const events = new Set<FirebaseAnalyticsJSCodedEvent>(this.eventQueue);
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
    options: FirebaseAnalyticsJSOptions,
    eventName: string,
    eventParams?: { [key: string]: any }
  ): FirebaseAnalyticsJSCodedEvent {
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
    const params: FirebaseAnalyticsJSCodedEvent = {
      en: eventName,
      _et: Date.now(),
      'ep.origin': options.origin,
    };
    if (eventParams) {
      for (let key in eventParams) {
        const paramKey =
          SHORT_EVENT_PARAMS[key] ||
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
    options: FirebaseAnalyticsJSOptions,
    userPropertyName: string,
    userPropertyValue: any
  ): string {
    if (
      !userPropertyName.length ||
      userPropertyName.length > 24 ||
      userPropertyName[0] === '_' ||
      !userPropertyName.match(/^[A-Za-z_]+$/) ||
      userPropertyName === 'user_id' ||
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
    const event = FirebaseAnalyticsJS.parseEvent(this.options, eventName, eventParams);
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
    if (screenName && screenName.length > 100) {
      throw new Error(
        'Invalid screen-name specified. Should contain 1 to 100 characters. Set to undefined to clear the current screen name.'
      );
    }
    if (!this.enabled) return;
    this.screenName = screenName || undefined;
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
    for (let name in userProperties) {
      const val = userProperties[name];
      const key = FirebaseAnalyticsJS.parseUserProperty(this.options, name, val);
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

  /**
   * Clears all analytics data for this instance.
   */
  async resetAnalyticsData() {
    this.clearEvents();
    this.screenName = undefined;
    this.userId = undefined;
    this.userProperties = undefined;
  }
}

export default FirebaseAnalyticsJS;
