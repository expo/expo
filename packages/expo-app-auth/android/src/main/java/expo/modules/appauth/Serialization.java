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
  
  static Map<String, String> jsonToStrings(Map<String, Object> map) {
    Map<String, String> newMap = new HashMap<>();
    for (String strKey : map.keySet()) {
      newMap.put(strKey, String.valueOf(map.get(strKey)));
    }
    return newMap;
  }

  static String scopesToString(ArrayList<String> scopes) {
    StringBuilder stringBuilder = new StringBuilder();
    for (int i = 0; i < scopes.size(); i++) {
      stringBuilder.append(scopes.get(i)).append(" ");
    }
    return stringBuilder.toString().trim();
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
    map.putString(AppAuthConstants.Props.TOKEN_TYPE, response.tokenType);
    // nullable | (RFC 6749), Section 5.1
    map.putString(AppAuthConstants.Props.ACCESS_TOKEN, response.accessToken);
    /**
     * If an access token is provided but the expiration time is not,
     * then the expiration time is typically some default value specified
     * by the identity provider through some other means, such as documentation or an additional
     * non-standard field.
     */
    if (response.accessTokenExpirationTime != null) {
      map.putString(AppAuthConstants.Props.ACCESS_TOKEN_EXPIRATION_DATE, unixTimeToString(response.accessTokenExpirationTime));
    }
    // OpenID Connect Core 1.0, Section 2
    map.putString(AppAuthConstants.Props.ID_TOKEN, response.idToken);
    // (RFC 6749), Section 5.1
    map.putString(AppAuthConstants.Props.REFRESH_TOKEN, response.refreshToken);

    if (response.getScopeSet() != null) {
      // (RFC 6749), Section 5.1
      map.putStringArrayList(AppAuthConstants.Props.SCOPES, new ArrayList<>(response.getScopeSet()));
    }

    if (!response.additionalParameters.isEmpty()) {
      Bundle bundle = new Bundle();
      for (Map.Entry<String, String> entry : response.additionalParameters.entrySet()) {
        bundle.putString(entry.getKey(), entry.getValue());
      }
      map.putBundle(AppAuthConstants.Props.ADDITIONAL_PARAMETERS, bundle);
    } else {
      map.putBundle(AppAuthConstants.Props.ADDITIONAL_PARAMETERS, null);
    }

    return map;
  }

}