# R8 strips this no-arg constructor, which WorkManager needs to create the InputMerger by reflection.
-keepclassmembers class * extends androidx.work.InputMerger {
    public <init>();
}
