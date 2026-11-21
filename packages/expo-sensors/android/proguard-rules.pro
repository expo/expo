# The Play Services libraries are `compileOnly` unless `expo.sensors.pedometer-play-services-enabled`
# is `true`. `PedometerModule` checks for them at runtime.
-dontwarn com.google.android.gms.common.**
-dontwarn com.google.android.gms.fitness.**
-dontwarn com.google.android.gms.location.**
-dontwarn com.google.android.gms.tasks.**
