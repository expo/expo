-keepclassmembers class com.facebook.react.ReactInstanceManager {
  private final com.facebook.react.bridge.JSBundleLoader mBundleLoader;
}

-keepclassmembers class com.facebook.react.devsupport.ReleaseDevSupportManager {
  private final com.facebook.react.bridge.JSExceptionHandler defaultJSExceptionHandler;
}

# Workaround zstd-kmp R8 issue - https://github.com/square/zstd-kmp/issues/108
-keep class com.squareup.zstd.** { *; }

# Room instantiates its generated `<Database>_Impl` by reflection, so R8 sees no caller for the
# no-arg constructor and strips it. Minified release builds then crash on first database access:
#   java.lang.NoSuchMethodException: expo.modules.updates.db.UpdatesDatabase_Impl.<init> []
# `extends` matches indirect subclasses, so this covers the generated implementation.
-keep class * extends androidx.room.RoomDatabase { <init>(); }
