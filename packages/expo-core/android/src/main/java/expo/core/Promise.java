package expo.core;

public abstract class Promise {
  private static String UNKNOWN_ERROR = "E_UNKNOWN_ERROR";

  public abstract void resolve(Object value);
  public abstract void reject(String code, String message, Throwable e);

  // Obsolete methods, however nice-to-have when porting React Native modules to Expo modules.
  public void reject(Throwable e) {
    reject(UNKNOWN_ERROR, e);
  }
  public void reject(String code, String message) {
    reject(code, message, null);
  }
  public void reject(String code, Throwable e) {
    reject(code, e.getMessage(), e);
  }
}
