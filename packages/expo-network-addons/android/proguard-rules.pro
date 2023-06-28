#
# NOTE: Keep the class names in sync with OkHttp and **ExpoOkHttpInterceptor.kt**
#

-keep class okhttp3.OkHttpClient$Builder {
  *;
}

-keep class expo.modules.networkaddons.ExpoOkHttpInterceptor {
  *;
}
