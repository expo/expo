package dev.expo.payments

import android.app.Activity
import android.content.Intent
import android.os.Bundle

class BrowserLauncherActivity : Activity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    val application = application as MainApplication
    if (!application.isActivityInBackStack(MainActivity::class.java)) {
      val intent = Intent(this, MainActivity::class.java)
      startActivity(intent)
    }
    finish()
  }
}
