package dev.expo.payments

import android.content.Context
import android.content.Intent

class ReactActivity : com.facebook.react.ReactActivity() {

    companion object {
        fun start(context: Context) {
            val intent = Intent(context, ReactActivity::class.java)
            context.startActivity(intent)
        }
    }

    override fun getMainComponentName(): String? {
        return "BareExpo"
    }

    override fun onBackPressed() {
        finish()
    }
}
