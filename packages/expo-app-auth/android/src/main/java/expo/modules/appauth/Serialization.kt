package expo.modules.appauth

import android.os.Bundle
import net.openid.appauth.TokenResponse
import java.text.SimpleDateFormat
import java.util.*

object Serialization {
  fun jsonToStrings(map: Map<String, Any>): MutableMap<String, String> {
    val newMap: MutableMap<String, String> = HashMap()
    for (strKey in map.keys) {
      newMap[strKey] = map[strKey].toString()
    }
    return newMap
  }

  fun scopesToString(scopes: ArrayList<String>): String {
    val stringBuilder = StringBuilder()
    for (scope in scopes) {
      stringBuilder.append(scopes).append(" ")
    }
    return stringBuilder.toString().trim { it <= ' ' }
  }

  private fun unixTimeToString(unixTime: Long?): String {
    val simpleDateFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'")
    simpleDateFormat.timeZone = TimeZone.getTimeZone("UTC")
    return simpleDateFormat.format(Date(unixTime!!))
  }

  // TODO: Bacon: Maybe use .jsonSerialize() instead
  fun tokenResponseNativeToJSON(response: TokenResponse): Bundle {
    val map = Bundle()


    // (RFC 6749), Section 4.1.4
    map.putString(AppAuthConstants.Props.TOKEN_TYPE, response.tokenType)
    // nullable | (RFC 6749), Section 5.1
    map.putString(AppAuthConstants.Props.ACCESS_TOKEN, response.accessToken)
    /**
     * If an access token is provided but the expiration time is not,
     * then the expiration time is typically some default value specified
     * by the identity provider through some other means, such as documentation or an additional
     * non-standard field.
     */
    if (response.accessTokenExpirationTime != null) {
      map.putString(AppAuthConstants.Props.ACCESS_TOKEN_EXPIRATION_DATE, unixTimeToString(response.accessTokenExpirationTime))
    }
    // OpenID Connect Core 1.0, Section 2
    map.putString(AppAuthConstants.Props.ID_TOKEN, response.idToken)
    // (RFC 6749), Section 5.1
    map.putString(AppAuthConstants.Props.REFRESH_TOKEN, response.refreshToken)
    if (response.scopeSet != null) {
      // (RFC 6749), Section 5.1
      map.putStringArrayList(AppAuthConstants.Props.SCOPES, ArrayList(response.scopeSet))
    }
    if (!response.additionalParameters.isEmpty()) {
      val bundle = Bundle()
      for ((key, value) in response.additionalParameters) {
        bundle.putString(key, value)
      }
      map.putBundle(AppAuthConstants.Props.ADDITIONAL_PARAMETERS, bundle)
    } else {
      map.putBundle(AppAuthConstants.Props.ADDITIONAL_PARAMETERS, null)
    }
    return map
  }
}