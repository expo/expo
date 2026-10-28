# expo-widgets brings in WorkManager through Glance. WorkManager creates its Room database
# (`androidx.work.impl.WorkDatabase_Impl`) and its input mergers by reflection, so R8 sees no
# caller for their no-arg constructors and strips them. Minified release builds then crash on
# launch in WorkManager's startup initializer:
#   java.lang.RuntimeException: Failed to create an instance of class androidx.work.impl.WorkDatabase.canonicalName
-keep class * extends androidx.room.RoomDatabase { <init>(); }
-keep class * extends androidx.work.InputMerger { <init>(); }
