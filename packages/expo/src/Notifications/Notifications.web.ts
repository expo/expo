export default {
  async getDevicePushTokenAsync(): Promise<{ type: string; data: Object }> {
    const data = await this.subscribeUserToPush();
    return { type: 'web', data: data };
  },

  async subscribeUserToPush(): Promise<Object> {
    const registration = await navigator.serviceWorker.register('/service-worker.js');
    const subscribeOptions = {
      userVisibleOnly: true,
      applicationServerKey: this.urlBase64ToUint8Array(
        'TODO: GET KEY FROM APP.JSON OR LIKE THIS https://docs.expo.io/versions/latest/guides/using-fcm/'
      ),
    };
    const pushSubscription = await registration.pushManager.subscribe(subscribeOptions);
    console.log('Received PushSubscription: ', JSON.stringify(pushSubscription));
    return pushSubscription;
  },

  // https://github.com/web-push-libs/web-push#using-vapid-key-for-applicationserverkey
  urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  },
};
