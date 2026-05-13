package dev.expo.brownfieldintegratedtester

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class BrownfieldTestModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
  override fun getName() = "BrownfieldTestModule"

  @ReactMethod
  fun getGreeting(name: String, promise: Promise) {
    promise.resolve("Hello, $name! From the Android hosting app.")
  }
}
