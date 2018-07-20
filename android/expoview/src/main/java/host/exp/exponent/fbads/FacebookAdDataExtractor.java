package host.exp.exponent.fbads;

import com.facebook.ads.NativeAd;
import com.facebook.ads.NativeAdBase;
import com.facebook.ads.internal.adapters.m;
import com.facebook.ads.internal.n.f;
import com.facebook.ads.internal.n.h;

import java.lang.reflect.Field;

/**
 * In Expo SDK 29 we've updated Facebook Audience Network library to 4.99.0 in which
 * Facebook had changed public NativeAd fields so we cannot access some properties
 * that were accessible before (title, iconUrl, etc.) Fortunately, we are able
 * to extract values for those fields using Java reflection.
 *
 * This class contains a couple of helper methods making it possible to access ad properties
 * required to maintain backwards compatibility with SDKs < 29.
 */
public class FacebookAdDataExtractor {
  public static String getTitle(NativeAd nativeAd) {
    try {
      f object1 = (f) extractFieldValue("a", nativeAd.getClass().getSuperclass(), nativeAd);
      m object2 = (m) extractFieldValue("a", object1.getClass(), object1);
      return (String) extractFieldValue("f", object2.getClass(), object2);
    } catch (Exception e) {
      e.printStackTrace();
      return null;
    }
  }

  public static String getUrl(NativeAdBase.Image image) {
    try {
      h url = (h) extractFieldValue("a", image.getClass(), image);
      return (String) extractFieldValue("a", url.getClass(), url);
    } catch (Exception e) {
      e.printStackTrace();
      return null;
    }
  }

  private static Object extractFieldValue(String fieldName, Class<?> targetClass, Object target) throws NoSuchFieldException, IllegalAccessException {
    Field field = targetClass.getDeclaredField(fieldName);
    field.setAccessible(true);
    return field.get(target);
  }
}
