package dev.expo.brownfieldintegratedtester

import android.os.Bundle
import android.widget.Toast
import androidx.activity.enableEdgeToEdge
import host.exp.exponent.brownfield.BrownfieldActivity
import host.exp.exponent.brownfield.showReactNativeFragment
import expo.modules.brownfield.BrownfieldMessage
import expo.modules.brownfield.BrownfieldMessaging
import expo.modules.brownfield.BrownfieldState
import expo.modules.brownfield.Removable
import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler
import java.util.Timer
import kotlin.concurrent.timerTask

class ReactNativeActivity : BrownfieldActivity(), DefaultHardwareBackBtnHandler {
    private var listenerId: String? = null
    private var stateListener: Removable? = null
    private var messageTimer: Timer? = null
    private var messageCounter = 0

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        showReactNativeFragment()

        listenerId =
            BrownfieldMessaging.addListener { message ->
                println("Message from React Native received:")
                println(message)
                showToast(message)
            }
        startMessageTimer()

        BrownfieldState.subscribe("counter") { state: Any? ->
            val count = state as? Double
            if (count == null) {
                println("Failed to parse state update as a double")
                return@subscribe
            }
            BrownfieldState.set("counter-duplicated", count * 2)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        listenerId?.let { BrownfieldMessaging.removeListener(it) }
        stopMessageTimer()
        stateListener?.remove()
    }

    private fun startMessageTimer() {
        messageTimer = Timer()
        messageTimer?.schedule(timerTask {
            sendMessage()
            setTime()
        }, 0, 1000)
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
        val nativeMessage = mapOf(
            "source" to mapOf(
                "platform" to "Android"
            ),
            "counter" to messageCounter,
            "timestamp" to System.currentTimeMillis(),
            "array" to listOf("ab", 'c', false, 1, 2.45)
        )
        BrownfieldMessaging.sendMessage(nativeMessage)
    }

    private fun setTime() {
        val timeString = java.time.LocalDateTime.now()
            .format(java.time.format.DateTimeFormatter.ofPattern("HH:mm:ss"))
        BrownfieldState.set("time", mapOf("time" to timeString))
    }

    override fun invokeDefaultOnBackPressed() {
        TODO("Not yet implemented")
    }
}