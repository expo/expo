package expo.modules.appauth;

import android.os.Bundle;

import net.openid.appauth.TokenResponse;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Locale;
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

  static Bundle tokenResponseNativeToJSON(TokenResponse response) {
    Bundle map = new Bundle();

    map.putString("accessToken", response.accessToken);

    if (response.accessTokenExpirationTime != null) {
      Date date = new Date(response.accessTokenExpirationTime);
      SimpleDateFormat simpleDateFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US);
      simpleDateFormat.setTimeZone(TimeZone.getTimeZone("UTC"));
      String dateString = simpleDateFormat.format(date);
      map.putString("accessTokenExpirationDate", dateString);
    }


    map.putString("idToken", response.idToken);
    map.putString("refreshToken", response.refreshToken);
    map.putString("tokenType", response.tokenType);


    Bundle additionalParametersMap = new Bundle();
    if (!response.additionalParameters.isEmpty()) {
      Iterator<String> iterator = response.additionalParameters.keySet().iterator();
      while (iterator.hasNext()) {
        String key = iterator.next();
        additionalParametersMap.putString(key, response.additionalParameters.get(key));
      }
    }
    map.putBundle("additionalParameters", additionalParametersMap);

    return map;
  }

}