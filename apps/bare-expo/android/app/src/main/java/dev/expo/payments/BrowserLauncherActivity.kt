package dev.expo.payments

import android.app.Activity
import android.content.Intent
import android.os.Bundle

class BrowserLauncherActivity : Activity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    startActivity(
      Intent(intent).apply {
        setClassName(
          this@BrowserLauncherActivity,
          MainActivity::class.java.name
        )
      }
    )
    finish()
  }
}
