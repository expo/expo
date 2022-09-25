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
    url;
    enabled;
    config;
    userId;
    userProperties;
    eventQueue = new Set();
    options;
    flushEventsPromise = Promise.resolve();
    flushEventsTimer;
    lastTime = -1;
    sequenceNr = 1;
    constructor(config, options) {
        // Verify the measurement- & client Ids
        if (!config.measurementId)
            throw new Error('No valid measurementId. Make sure to provide a valid measurementId with a G-XXXXXXXXXX format.');
        if (!options.clientId)
            throw new Error('No valid clientId. Make sure to provide a valid clientId with a UUID (v4) format.');
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
    async send(events) {
        const { config, options } = this;
        let queryArgs = {
            ...options.customArgs,
            v: 2,
            tid: config.measurementId,
            cid: options.clientId,
            sid: options.sessionId,
            _s: this.sequenceNr++,
            seg: 1,
        };
        if (options.sessionNumber)
            queryArgs.sct = options.sessionNumber;
        if (options.userLanguage)
            queryArgs.ul = options.userLanguage;
        if (options.appName)
            queryArgs.an = options.appName;
        if (options.appVersion)
            queryArgs.av = options.appVersion;
        if (options.docTitle)
            queryArgs.dt = options.docTitle;
        if (options.docLocation)
            queryArgs.dl = options.docLocation;
        if (options.screenRes)
            queryArgs.sr = options.screenRes;
        if (options.debug)
            queryArgs._dbg = 1;
        if (this.sequenceNr === 2)
            queryArgs._ss = 1; // Session start
        let body;
        const lastTime = this.lastTime;
        if (events.size > 1) {
            body = '';
            events.forEach((event) => {
                body += encodeQueryArgs(event, this.lastTime) + '\n';
                this.lastTime = event._et;
            });
        }
        else if (events.size === 1) {
            const event = events.values().next().value;
            this.lastTime = event._et;
            queryArgs = {
                ...event,
                ...queryArgs,
            };
        }
        const args = encodeQueryArgs(queryArgs, lastTime);
        const url = `${this.url}?${args}`;
        await fetch(url, {
            method: 'POST',
            mode: 'no-cors',
            cache: 'no-cache',
            headers: {
                'Content-Type': 'text/plain;charset=UTF-8',
                ...(options.headers || {}),
            },
            body,
        });
    }
    async addEvent(event) {
        const { userId, userProperties, options } = this;
        // Extend the event with the currently set User-id
        if (userId)
            event.uid = userId;
        // Add user-properties
        if (userProperties) {
            for (const name in userProperties) {
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
                }
                catch {
                    // no-op
                }
                this.flushEventsPromise = this.flushEvents();
            }, options.debug ? 10 : options.maxCacheTime);
        }
    }
    async flushEvents() {
        if (!this.eventQueue.size)
            return;
        const events = new Set(this.eventQueue);
        await this.send(events);
        events.forEach((event) => this.eventQueue.delete(event));
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
    static isValidName(name, maxLength) {
        return !!(name &&
            name.length &&
            name.length <= maxLength &&
            name.match(/^[A-Za-z][A-Za-z_\d]*$/) &&
            !name.startsWith('firebase_') &&
            !name.startsWith('google_') &&
            !name.startsWith('ga_'));
    }
    /**
     * Parses an event (as passed to logEvent) and throws an error when the
     * event-name or parameters are invalid.
     *
     * Upon success, returns the event in encoded format, ready to be send
     * through the Google Measurement API v2.
     */
    static parseEvent(options, eventName, eventParams) {
        if (!FirebaseAnalyticsJS.isValidName(eventName, 40)) {
            throw new Error(`Invalid event-name (${eventName}) specified. Should contain 1 to 40 alphanumeric characters or underscores. The name must start with an alphabetic character.`);
        }
        const params = {
            en: eventName,
            _et: Date.now(),
            'ep.origin': options.origin,
        };
        if (eventParams) {
            for (const key in eventParams) {
                if (key === 'items' && Array.isArray(eventParams[key])) {
                    eventParams[key].forEach((item, index) => {
                        const itemFields = [];
                        let customItemFieldCount = 0;
                        Object.keys(item).forEach((itemKey) => {
                            if (SHORT_EVENT_ITEM_PARAMS[itemKey]) {
                                itemFields.push(`${SHORT_EVENT_ITEM_PARAMS[itemKey]}${item[itemKey]}`);
                            }
                            else {
                                itemFields.push(`k${customItemFieldCount}${itemKey}`);
                                itemFields.push(`v${customItemFieldCount}${item[itemKey]}`);
                                customItemFieldCount++;
                            }
                        });
                        params[`pr${index + 1}`] = itemFields.join('~');
                    });
                }
                else {
                    const paramKey = SHORT_EVENT_PARAMS[key] ||
                        (typeof eventParams[key] === 'number' ? `epn.${key}` : `ep.${key}`);
                    params[paramKey] = eventParams[key];
                }
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
    static parseUserProperty(options, userPropertyName, userPropertyValue) {
        if (!FirebaseAnalyticsJS.isValidName(userPropertyName, 24) || userPropertyName === 'user_id') {
            throw new Error(`Invalid user-property name (${userPropertyName}) specified. Should contain 1 to 24 alphanumeric characters or underscores. The name must start with an alphabetic character.`);
        }
        if (userPropertyValue !== undefined &&
            userPropertyValue !== null &&
            options.strictNativeEmulation &&
            (typeof userPropertyValue !== 'string' || userPropertyValue.length > 36)) {
            throw new Error('Invalid user-property value specified. Value should be a string of up to 36 characters long.');
        }
        return typeof userPropertyValue === 'number'
            ? `upn.${userPropertyName}`
            : `up.${userPropertyName}`;
    }
    /**
     * https://firebase.google.com/docs/reference/js/firebase.analytics.Analytics#log-event
     */
    async logEvent(eventName, eventParams) {
        const event = FirebaseAnalyticsJS.parseEvent(this.options, eventName, eventParams);
        if (!this.enabled)
            return;
        if (this.options.debug) {
            console.log(`FirebaseAnalytics event: "${eventName}", params: ${JSON.stringify(eventParams, undefined, 2)}`);
        }
        return this.addEvent(event);
    }
    /**
     * https://firebase.google.com/docs/reference/js/firebase.analytics.Analytics#set-analytics-collection-enabled
     */
    async setAnalyticsCollectionEnabled(isEnabled) {
        this.enabled = isEnabled;
    }
    /**
     * Not supported, this method is a no-op
     */
    async setSessionTimeoutDuration(_sessionTimeoutInterval) {
        // no-op
    }
    /**
     * https://firebase.google.com/docs/reference/js/firebase.analytics.Analytics#set-user-id
     */
    async setUserId(userId) {
        if (!this.enabled)
            return;
        this.userId = userId || undefined;
    }
    /**
     * https://firebase.google.com/docs/reference/js/firebase.analytics.Analytics#set-user-properties
     */
    async setUserProperties(userProperties) {
        if (!this.enabled)
            return;
        for (const name in userProperties) {
            const val = userProperties[name];
            const key = FirebaseAnalyticsJS.parseUserProperty(this.options, name, val);
            if (val === null || val === undefined) {
                if (this.userProperties) {
                    delete this.userProperties[key];
                }
            }
            else {
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
        this.userId = undefined;
        this.userProperties = undefined;
    }
    /**
     * Enables or disabled debug mode.
     */
    async setDebugModeEnabled(isEnabled) {
        this.options.debug = isEnabled;
    }
    /**
     * Sets a new value for the client ID.
     */
    setClientId(clientId) {
        this.options.clientId = clientId;
    }
}
function encodeQueryArgs(queryArgs, lastTime) {
    let keys = Object.keys(queryArgs);
    if (lastTime < 0) {
        keys = keys.filter((key) => key !== '_et');
    }
    return keys
        .map((key) => {
        return `${key}=${encodeURIComponent(key === '_et' ? Math.max(queryArgs[key] - lastTime, 0) : queryArgs[key])}`;
    })
        .join('&');
}
const SHORT_EVENT_PARAMS = {
    currency: 'cu',
};
// https://developers.google.com/gtagjs/reference/event
const SHORT_EVENT_ITEM_PARAMS = {
    id: 'id',
    name: 'nm',
    brand: 'br',
    category: 'ca',
    coupon: 'cp',
    list: 'ln',
    list_name: 'ln',
    list_position: 'lp',
    price: 'pr',
    location_id: 'lo',
    quantity: 'qt',
    variant: 'va',
    affiliation: 'af',
    discount: 'ds',
};
export default FirebaseAnalyticsJS;
//# sourceMappingURL=FirebaseAnalyticsJS.js.map