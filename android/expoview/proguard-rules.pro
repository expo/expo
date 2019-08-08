# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /Users/ide/Library/Android/sdk/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:

# If your project uses WebView with JS, uncomment the following
# and specify the fully qualified class name to the JavaScript interface
# class:
#-keepclassmembers class fqcn.of.javascript.interface.for.webview {
#   public *;
#}


# THIS IS VERY VERY BAD. REMOVE AS SOON AS VERSIONING IS FIXED
-dontwarn **


-dontnote **

-keep class host.exp.exponent.generated.AppConstants { *; }

##### Crashlytics #####
-keepattributes SourceFile,LineNumberTable

##### Expo Universal Modules #####

-keepclassmembers class * {
  @**.expo.core.interfaces.ExpoProp *;
}
-keepclassmembers class * {
  @**.expo.core.interfaces.ExpoMethod *;
}

-keep @**.expo.core.interfaces.DoNotStrip class *
-keepclassmembers class * {
  @**.expo.core.interfaces.DoNotStrip *;
}

##### React Native #####
-keep,allowobfuscation @interface **.facebook.proguard.annotations.DoNotStrip
-keep,allowobfuscation @interface **.facebook.proguard.annotations.KeepGettersAndSetters
-keep,allowobfuscation @interface **.facebook.react.bridge.ReadableType

# Do not strip any method/class that is annotated with @DoNotStrip
-keep @**.facebook.proguard.annotations.DoNotStrip class *
-keepclassmembers class * {
  @**.facebook.proguard.annotations.DoNotStrip *;
}

-keepclassmembers @**.facebook.proguard.annotations.KeepGettersAndSetters class * {
  void set*(***);
  *** get*();
}

-keep class * extends **.facebook.react.bridge.JavaScriptModule { *; }
-keep class * extends **.facebook.react.bridge.NativeModule { *; }
-keepclassmembers class *  { @**.facebook.react.uimanager.UIProp <fields>; }
-keepclassmembers class *  { @**.facebook.react.uimanager.ReactProp <methods>; }
-keepclassmembers class *  { @**.facebook.react.uimanager.ReactPropGroup <methods>; }

# TODO: shouldn't need these two rules
-keep interface **.facebook.react.bridge.** { *; }
-keep enum **.facebook.react.bridge.** { *; }

##### Versioned React Native #####
-keep class **.facebook.** { *; }
-keep class abi** { *; }
-keep class versioned** { *; }
-keep class expo.modules** { *; }

##### Butterknife #####
-keep class butterknife.** { *; }
-dontwarn butterknife.internal.**
-keep class **$$ViewBinder { *; }

-keepclasseswithmembernames class * {
    @butterknife.* <fields>;
}

-keepclasseswithmembernames class * {
    @butterknife.* <methods>;
}

##### Stetho #####
-keep class **.facebook.stetho.** { *; }
-dontwarn **.facebook.stetho.**

##### fresco #####
# Keep our interfaces so they can be used by other ProGuard rules.
# See http://sourceforge.net/p/proguard/bugs/466/
-keep,allowobfuscation @interface **.facebook.common.internal.DoNotStrip

# Do not strip any method/class that is annotated with @DoNotStrip
-keep @**.facebook.common.internal.DoNotStrip class *
-keepclassmembers class * {
    @**.facebook.common.internal.DoNotStrip *;
}

# Keep native methods
-keepclassmembers class * {
    native <methods>;
}

-dontwarn okio.**
-dontwarn javax.annotation.**
-dontwarn com.android.volley.toolbox.**

##### okhttp #####
-keepattributes Signature
-keepattributes *Annotation*
-keep class com.squareup.okhttp.** { *; }
-keep interface com.squareup.okhttp.** { *; }
# This is also needed by Picasso
-dontwarn com.squareup.okhttp.**

-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }
# This is also needed by Picasso
-dontwarn okhttp3.**

##### okio #####
-keep class sun.misc.Unsafe { *; }
-dontwarn java.nio.file.*
-dontwarn org.codehaus.mojo.animal_sniffer.IgnoreJRERequirement
-dontwarn okio.**

##### EventBus #####
-keepclassmembers class ** {
    public void onEvent*(***);
}

# Only required if you use AsyncExecutor
-keepclassmembers class * extends de.greenrobot.event.util.ThrowableFailureEvent {
    <init>(java.lang.Throwable);
}

##### Amplitude #####
-keep class com.amplitude.api.** {*;}

##### DBFlow #####
-keep class com.raizlabs.android.dbflow.config.GeneratedDatabaseHolder

##### SpongyCastle #####
-keep class org.spongycastle.**
-dontwarn org.spongycastle.jce.provider.X509LDAPCertStoreSpi
-dontwarn org.spongycastle.x509.util.LDAPStoreHelper
