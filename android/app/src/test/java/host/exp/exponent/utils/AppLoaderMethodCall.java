package host.exp.exponent.utils;

import org.junit.Assert;

public class AppLoaderMethodCall {
  private String mMethod;
  private Object mValue;

  public AppLoaderMethodCall(final String method, final Object value) {
    mMethod = method;
    mValue = value;
  }

  public static void assertEqual(AppLoaderMethodCall expected, AppLoaderMethodCall actual) {
    Assert.assertEquals(expected.mMethod, actual.mMethod);
    Assert.assertEquals(expected.mValue.toString(), actual.mValue.toString());
  }
}
