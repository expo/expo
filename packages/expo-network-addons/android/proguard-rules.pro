#
# NOTE: Keep the class names in sync with OkHttp and **ExpoOkHttpInterceptor.kt**
#

-keep class okhttp3.OkHttpClient$Builder {
  *;
}

-keep class expo.modules.networkaddons.ExpoOkHttpInterceptor {
  *;
}

# Workaround zstd-kmp R8 issue - https://github.com/square/zstd-kmp/issues/108
-keep class com.squareup.zstd.** { *; }
