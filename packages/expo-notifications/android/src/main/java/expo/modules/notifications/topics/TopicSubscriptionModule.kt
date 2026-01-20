package expo.modules.notifications.topics

import com.google.firebase.messaging.FirebaseMessaging
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

private const val TOPIC_SUBSCRIBE_FAIL_CODE = "E_TOPIC_SUBSCRIBE_FAILED"
private const val TOPIC_UNSUBSCRIBE_FAIL_CODE = "E_TOPIC_UNSUBSCRIBE_FAILED"

class TopicSubscriptionModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoTopicSubscriptionModule")

    /**
     * Subscribe to a broadcast topic
     *
     * @param topic Broadcast topic to subscribe to
     * @param promise Promise to be settled when the operation completes
     */
    AsyncFunction("subscribeToTopicAsync") { topic: String, promise: Promise ->
      FirebaseMessaging.getInstance().subscribeToTopic(topic)
        .addOnCompleteListener { task ->
          if (task.isSuccessful) {
            promise.resolve(null)
          } else {
            val exception = task.exception
            promise.reject(TOPIC_SUBSCRIBE_FAIL_CODE, "Subscribing to the topic '$topic' failed: ${exception?.message ?: "unknown"}", exception)
          }
        }
    }

    /**
     * Unsubscribe from a previously subscribed broadcast topic
     *
     * @param topic Broadcast topic to unsubscribe from
     * @param promise Promise to be settled when the operation completes
     */
    AsyncFunction("unsubscribeFromTopicAsync") { topic: String, promise: Promise ->
      FirebaseMessaging.getInstance().unsubscribeFromTopic(topic)
        .addOnCompleteListener { task ->
          if (task.isSuccessful) {
            promise.resolve(null)
          } else {
            val exception = task.exception
            promise.reject(TOPIC_UNSUBSCRIBE_FAIL_CODE, "Unsubscribing from the topic '$topic' failed: ${exception?.message ?: "unknown"}", exception)
          }
        }
    }
  }
}
