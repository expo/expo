package dev.expo.brownfieldintegratedtester

import android.os.Bundle
import androidx.activity.enableEdgeToEdge
import host.exp.exponent.brownfield.showReactNativeFragment

class ReactNativeActivity : BrownfieldTestActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    enableEdgeToEdge()
    showReactNativeFragment()
    setupBrownfieldTests()
  }
}
