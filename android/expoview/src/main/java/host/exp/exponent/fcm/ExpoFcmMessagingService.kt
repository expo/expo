package host.exp.exponent.fcm

import android.annotation.SuppressLint
import expo.modules.notifications.service.NotificationsService
import expo.modules.notifications.service.interfaces.FirebaseMessagingDelegate

@SuppressLint("MissingFirebaseInstanceTokenRefresh")
class ExpoFcmMessagingService : NotificationsService() {
  override val firebaseMessagingDelegate: FirebaseMessagingDelegate by lazy {
    ExpoFirebaseMessagingDelegate(this)
  }
}
