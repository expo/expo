
-keepclassmembers class * {
  @expo.modules.core.interfaces.ExpoProp *;
}

-keepclassmembers class * {
  @expo.modules.core.interfaces.ExpoMethod *;
}

-keep @expo.modules.core.interfaces.DoNotStrip class *
-keepclassmembers class * {
  @expo.modules.core.interfaces.DoNotStrip *;
}

-keep class * implements expo.modules.kotlin.records.Record {
  *;
}
-keepclassmembers enum * implements expo.modules.kotlin.types.Enumerable {
  *; 
}
