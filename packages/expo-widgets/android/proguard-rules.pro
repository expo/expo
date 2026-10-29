# WorkManager creates its Room database by reflection during app startup.
-keep class * extends androidx.room.RoomDatabase { <init>(); }
