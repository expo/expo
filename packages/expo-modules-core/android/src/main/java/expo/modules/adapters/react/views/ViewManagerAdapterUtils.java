package expo.modules.adapters.react.views;

public class ViewManagerAdapterUtils {
  public static String normalizeEventName(final String eventName) {
    if (eventName.startsWith("on")) {
      return "top" + eventName.substring(2);
    }
    return eventName;
  }
}
