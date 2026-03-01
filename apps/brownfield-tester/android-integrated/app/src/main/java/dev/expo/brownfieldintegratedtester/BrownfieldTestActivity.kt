package dev.expo.brownfieldintegratedtester

import android.util.Log
import android.widget.Toast
import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler
import expo.modules.brownfield.BrownfieldMessage
import expo.modules.brownfield.BrownfieldMessaging
import expo.modules.brownfield.BrownfieldState
import expo.modules.brownfield.Removable
import host.exp.exponent.brownfield.BrownfieldActivity
import java.util.Timer
import kotlin.concurrent.timerTask

open class BrownfieldTestActivity : BrownfieldActivity(), DefaultHardwareBackBtnHandler {
  // Listeners
  private var messagingListenerId: String? = null
  private var stateListeners: MutableList<Removable?> = mutableListOf()

  // Other test utils
  private var messageTimer: Timer? = null
  private var messageCounter = 0

  fun setupBrownfieldTests() {
    // Messaging
    messagingListenerId =
        BrownfieldMessaging.addListener { message ->
          Log.i("BrownfieldTestActivity", "Message from React Native received:")
          Log.i("BrownfieldTestActivity", message.toString())
          showToast(message)
        }

    setupStateListeners()
    startMessageTimer()
  }

  override fun onDestroy() {
    super.onDestroy()
    // Clean up messaging tests
    messagingListenerId?.let { BrownfieldMessaging.removeListener(it) }
    stopMessageTimer()
    // Clean up state tests
    stateListeners.forEach { it?.remove() }
  }

  private fun startMessageTimer() {
    messageTimer =
        Timer().apply {
          schedule(
              timerTask {
                sendMessage()
                setTime()
              },
              0,
              1000,
          )
        }
  }

  private fun setupStateListeners() {
    stateListeners +=
        mutableListOf<Removable?>(
            BrownfieldState.subscribe("number") { number ->
              val cast = number as? Double
              if (cast != null) {
                Log.i("BrownfieldState", cast.toString())
              }
            },
            BrownfieldState.subscribe("string") { string ->
              val cast = string as? String
              if (cast != null) {
                Log.i("BrownfieldState", cast)
              }
            },
            BrownfieldState.subscribe("boolean") { bool ->
              val cast = bool as? Boolean
              if (cast != null) {
                Log.i("BrownfieldState", cast.toString())
              }
            },
            BrownfieldState.subscribe("array") { array ->
              val cast = array as? MutableList<*>
              if (cast != null) {
                Log.i("BrownfieldState", cast.toString())
              }
            },
            BrownfieldState.subscribe("object") { obj ->
              val cast = obj as? MutableMap<*, *>
              if (cast != null) {
                Log.i("BrownfieldState", cast.toString())
              }
            },
        )
  }

  private fun stopMessageTimer() {
    messageTimer?.cancel()
    messageTimer = null
  }

  private fun showToast(message: BrownfieldMessage) {
    val sender = message["sender"] as? String
    val nested = message["source"] as? Map<*, *>
    val platform = nested?.get("platform") as? String
    if (sender != null && platform != null) {
      Toast.makeText(this, "$platform($sender)", Toast.LENGTH_LONG).show()
    }
  }

  private fun sendMessage() {
    messageCounter++
    val nativeMessage =
        mapOf(
            "source" to mapOf("platform" to "Android"),
            "counter" to messageCounter,
            "timestamp" to System.currentTimeMillis(),
            "array" to listOf("ab", 'c', false, 1, 2.45),
        )
    BrownfieldMessaging.sendMessage(nativeMessage)
  }

  private fun setTime() {
    val timeString =
        java.time.LocalDateTime.now()
            .format(java.time.format.DateTimeFormatter.ofPattern("HH:mm:ss"))
    BrownfieldState.set("time", timeString)
  }

  override fun invokeDefaultOnBackPressed() {
    TODO("Not yet implemented")
  }
}
