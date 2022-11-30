
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

-keepclassmembers class * implements expo.modules.kotlin.views.ExpoView {
  public <init>(android.content.Context);
  public <init>(android.content.Context, expo.modules.kotlin.AppContext);
}

-keepclassmembers class * {
  expo.modules.kotlin.viewevent.ViewEventCallback *;
}

-keepclassmembers class * {
  expo.modules.kotlin.viewevent.ViewEventDelegate *;
}
