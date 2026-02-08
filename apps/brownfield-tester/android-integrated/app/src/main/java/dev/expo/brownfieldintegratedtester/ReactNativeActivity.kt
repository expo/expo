package dev.expo.brownfieldintegratedtester

import android.os.Bundle
import android.widget.Toast
import androidx.activity.enableEdgeToEdge
import host.exp.exponent.brownfield.BrownfieldActivity
import host.exp.exponent.brownfield.showReactNativeFragment
import expo.modules.brownfield.BrownfieldMessage
import expo.modules.brownfield.BrownfieldMessaging
import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler
import java.util.Timer
import kotlin.concurrent.timerTask

class ReactNativeActivity : BrownfieldActivity(), DefaultHardwareBackBtnHandler {
    private var listenerId: String? = null
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
    }

    override fun onDestroy() {
        super.onDestroy()
        listenerId?.let { BrownfieldMessaging.removeListener(it) }
        stopMessageTimer()
    }

    private fun startMessageTimer() {
        messageTimer = Timer()
        // Schedule: delay 0ms, repeat every 5000ms (5 seconds)
        messageTimer?.schedule(timerTask {
            sendMessage()
        }, 0, 2500)
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

    override fun invokeDefaultOnBackPressed() {
        TODO("Not yet implemented")
    }
}