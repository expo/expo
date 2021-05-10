
-keepclassmembers class * {
  @org.unimodules.core.interfaces.ExpoProp *;
}

-keepclassmembers class * {
  @org.unimodules.core.interfaces.ExpoMethod *;
}

-keep @org.unimodules.core.interfaces.DoNotStrip class *
-keepclassmembers class * {
  @org.unimodules.core.interfaces.DoNotStrip *;
}
