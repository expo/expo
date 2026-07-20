# Consumer ProGuard rules shipped inside the brownfield AAR (and aggregated into the
# fused AAR via AGP Fused Library). The host app's R8/ProGuard reads these rules to
# avoid stripping classes that the runtime loads via reflection.
#
# Mirrors the relevant subset of expo-modules-core/android/proguard-rules.pro and
# adds keep rules for ReactActivityLifecycleListener (silently disabled features
# like edge-to-edge depend on it).

# Expo Module Services — reflection-loaded via Service.construct() in
# expo.modules.kotlin.services.ServicesRegistry. Stripping their constructors
# causes `NoSuchMethodException` / `Array is empty` at startup.
-keep interface expo.modules.kotlin.services.Service
-keep class * implements expo.modules.kotlin.services.Service {
    <init>(...);
}

# Expo Module Package classes — referenced by FQN in the autolinking-generated
# `ExpoModulesPackageList.<clinit>`. Stripping causes `NoClassDefFoundError`.
-keep class * implements expo.modules.core.interfaces.Package {
    public <init>(...);
}

# Expo Modules — public constructors + the `definition()` method must survive
# obfuscation/minification for the registry to instantiate them.
-keep,allowoptimization,allowobfuscation class * extends expo.modules.kotlin.modules.Module {
    public <init>();
    public expo.modules.kotlin.modules.ModuleDefinitionData definition();
}

# ReactActivityLifecycleListener implementations — Expo modules return these from
# `createReactActivityLifecycleListeners()` (e.g. `EdgeToEdgePackage` enables
# edge-to-edge via its lifecycle hook). Lost listeners = silently disabled
# features in the host app.
-keep class * implements expo.modules.core.interfaces.ReactActivityLifecycleListener
-keepclassmembers class * implements expo.modules.core.interfaces.ReactActivityLifecycleListener {
    public <init>(...);
}

# DoNotStrip + Record + Enumerable patterns from expo-modules-core.
-keep @expo.modules.core.interfaces.DoNotStrip class *
-keepclassmembers class * {
    @expo.modules.core.interfaces.DoNotStrip *;
}
-keep interface expo.modules.kotlin.records.Record
-keep class * implements expo.modules.kotlin.records.Record { *; }
-keep class * extends expo.modules.kotlin.sharedobjects.SharedObject
-keep enum * implements expo.modules.kotlin.types.Enumerable { *; }
-keepnames class kotlin.Pair

# ExpoView constructors — Expo view modules call these via reflection from the
# kotlin view registry.
-keepclassmembers class * implements expo.modules.kotlin.views.ExpoView {
    public <init>(android.content.Context);
    public <init>(android.content.Context, expo.modules.kotlin.AppContext);
}
-keepnames class * implements expo.modules.kotlin.views.ExpoView { *; }

# View event delegation fields read via reflection from the kotlin view runtime.
-keepclassmembers class * {
    expo.modules.kotlin.viewevent.ViewEventCallback *;
}
-keepclassmembers class * {
    expo.modules.kotlin.viewevent.ViewEventDelegate *;
}

# ComposeProps implementations loaded reflectively for Compose-based views.
-keep class * implements expo.modules.kotlin.views.ComposeProps { *; }
