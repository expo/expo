package host.exp.exponent.fcm

import android.annotation.SuppressLint
import expo.modules.notifications.service.ExpoFirebaseMessagingService
import expo.modules.notifications.service.interfaces.FirebaseMessagingDelegate

@SuppressLint("MissingFirebaseInstanceTokenRefresh")
class ExpoFcmMessagingService : ExpoFirebaseMessagingService() {
  override val firebaseMessagingDelegate: FirebaseMessagingDelegate by lazy {
    ExpoFirebaseMessagingDelegate(this)
  }
}
