# WorkManager creates input mergers by reflection, so keep their no-arg constructors.
-keep class * extends androidx.work.InputMerger { <init>(); }
