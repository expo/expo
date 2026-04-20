package host.exp.exponent

// Needed for `react-native link`
// import com.facebook.react.ReactApplication;
class MainApplication : ExpoApplication() {
  override val isDebug: Boolean
    get() = BuildConfig.DEBUG
}
