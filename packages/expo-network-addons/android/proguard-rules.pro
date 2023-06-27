#
# NOTE: Keeps the class names in sync with okhttp and the **ExpoOkHttpInterceptor.kt**
#

-keep class okhttp3.OkHttpClient$Builder {
  *;
}

-keep class expo.modules.networkaddons.ExpoOkHttpInterceptor {
  *;
}
