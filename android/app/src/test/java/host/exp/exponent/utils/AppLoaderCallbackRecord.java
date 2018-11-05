package host.exp.exponent.utils;

import org.junit.Assert;

/*
 * Keeps track of a single AppLoader callback
 */
public class AppLoaderCallbackRecord {
  private String mMethod;
  private Object mValue;

  public AppLoaderCallbackRecord(final String method, final Object value) {
    mMethod = method;
    mValue = value;
  }

  public static void assertEqual(AppLoaderCallbackRecord expected, AppLoaderCallbackRecord actual) {
    Assert.assertEquals(expected.mMethod, actual.mMethod);
    Assert.assertEquals(expected.mValue.toString(), actual.mValue.toString());
  }
}
