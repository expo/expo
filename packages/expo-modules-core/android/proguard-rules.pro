
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
