package abi28_0_0.host.exp.exponent.modules.api.fbads;

import com.facebook.ads.NativeAd;
import com.facebook.ads.NativeAdBase;

import java.lang.reflect.Field;

/**
 * In Expo SDK 29 we've updated Facebook Audience Network library to 4.99.0 in which
 * Facebook had changed public NativeAd fields so we cannot access some properties
 * that were accessible before (title, iconUrl, etc.) Fortunately, we are able
 * to extract values for those fields using Java reflection.
 * <p>
 * This class contains a couple of helper methods making it possible to access ad properties
 * required to maintain backwards compatibility with SDKs < 29.
 */
public class FacebookAdDataExtractor {
  public static String getTitle(NativeAd nativeAd) {
    return null;
//    try {
//      e object1 = (e) extractFieldValue("a", nativeAd.getClass().getSuperclass(), nativeAd);
//      i object2 = (i) extractFieldValue("a", object1.getClass(), object1);
//      HashMap object3 = (HashMap) extractFieldValue("e", object2.getClass(), object2);
//      return (String) object3.get("title");
//    } catch (Exception e) {
//      e.printStackTrace();
//      return null;
//    }
  }

  public static String getUrl(NativeAdBase.Image image) {
    return null;
//    try {
//      g object1 = (g) extractFieldValue("a", image.getClass(), image);
//      return (String) extractFieldValue("a", object1.getClass(), object1);
//    } catch (Exception e) {
//      e.printStackTrace();
//      return null;
//    }
  }

  private static Object extractFieldValue(String fieldName, Class<?> targetClass, Object target) throws NoSuchFieldException, IllegalAccessException {
    Field field = targetClass.getDeclaredField(fieldName);
    field.setAccessible(true);
    return field.get(target);
  }
}
