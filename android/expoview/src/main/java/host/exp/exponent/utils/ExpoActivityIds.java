package host.exp.exponent.utils;

public class ExpoActivityIds {
  // This class is giving appropriate activity IDs based on the type of the activity.
  // We have three types of Expo activities:
  // 1. Kernel activity - this is always with activity ID = -1.
  // 2. App activities - their IDs grow up starting from 0 as the kernel activity is initialized first.
  // 3. Headless activities - IDs are decreasing starting from -2.

  private static int currentAppActivityId = 0;
  private static int currentHeadlessActivityId = -2;

  public static int getNextAppActivityId() {
    return currentAppActivityId++;
  }

  public static int getNextHeadlessActivityId() {
    return currentHeadlessActivityId--;
  }
}
