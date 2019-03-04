package expo.modules.appauth;

import android.os.Bundle;

import net.openid.appauth.TokenResponse;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.TimeZone;

public class Serialization {

  private static String join(List<String> msgs) {
    return msgs == null || msgs.size() == 0 ? "" : msgs.size() == 1 ? msgs.get(0) : msgs.subList(0, msgs.size() - 1).toString().replaceAll("^.|.$", "") + " and " + msgs.get(msgs.size() - 1);
  }

  static Map<String, String> jsonToStrings(Map<String, Object> map) {
    Map<String, String> newMap = new HashMap<>();
    for (String strKey : map.keySet()) {
      newMap.put(strKey, String.valueOf(map.get(strKey)));
    }
    return newMap;
  }

  static String scopesToString(ArrayList<String> scopes) {
    return join(scopes);
  }

  private static String unixTimeToString(Long unixTime) {
    SimpleDateFormat simpleDateFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'");
    simpleDateFormat.setTimeZone(TimeZone.getTimeZone("UTC"));
    return simpleDateFormat.format(new Date(unixTime));
  }

  // TODO: Bacon: Maybe use .jsonSerialize() instead
  static Bundle tokenResponseNativeToJSON(TokenResponse response) {
    Bundle map = new Bundle();


    // (RFC 6749), Section 4.1.4
    map.putString(AppAuthConstants.Props.tokenType, response.tokenType);
    // nullable | (RFC 6749), Section 5.1
    map.putString(AppAuthConstants.Props.accessToken, response.accessToken);
    /**
     * If an access token is provided but the expiration time is not,
     * then the expiration time is typically some default value specified
     * by the identity provider through some other means, such as documentation or an additional
     * non-standard field.
     */
    if (response.accessTokenExpirationTime != null) {
      map.putString(AppAuthConstants.Props.accessTokenExpirationDate, unixTimeToString(response.accessTokenExpirationTime));
    }
    // OpenID Connect Core 1.0, Section 2
    map.putString(AppAuthConstants.Props.idToken, response.idToken);
    // (RFC 6749), Section 5.1
    map.putString(AppAuthConstants.Props.refreshToken, response.refreshToken);

    if (response.getScopeSet() != null) {
      // (RFC 6749), Section 5.1
      map.putStringArrayList(AppAuthConstants.Props.scopes, new ArrayList<>(response.getScopeSet()));
    }

    if (!response.additionalParameters.isEmpty()) {
      Bundle bundle = new Bundle();
      for (Map.Entry<String, String> entry : response.additionalParameters.entrySet()) {
        bundle.putString(entry.getKey(), entry.getValue());
      }
      map.putBundle(AppAuthConstants.Props.additionalParameters, bundle);
    } else {
      map.putBundle(AppAuthConstants.Props.additionalParameters, null);
    }

    return map;
  }

}