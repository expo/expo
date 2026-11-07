-keep class expo.modules.backgroundtask.** { *; }

# WorkManager creates its Room database and input mergers by reflection, so keep their no-arg constructors.
-keep class * extends androidx.room.RoomDatabase { <init>(); }
-keep class * extends androidx.work.InputMerger { <init>(); }
