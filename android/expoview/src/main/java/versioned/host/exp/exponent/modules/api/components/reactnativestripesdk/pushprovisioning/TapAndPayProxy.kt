package versioned.host.exp.exponent.modules.api.components.reactnativestripesdk.pushprovisioning

import android.app.Activity
import android.util.Log
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.WritableNativeMap
import versioned.host.exp.exponent.modules.api.components.reactnativestripesdk.utils.createError
import com.google.android.gms.tasks.Task

typealias TokenCheckHandler = (isCardInWallet: Boolean, token: WritableMap?, error: WritableMap?) -> Unit

object TapAndPayProxy {
  private const val TAG = "StripeTapAndPay"
  private var tapAndPayClient: Any? = null
  const val REQUEST_CODE_TOKENIZE = 90909

  private fun getTapandPayTokens(activity: Activity): Task<List<Any>>? {
    return try {
      val tapAndPayClass = Class.forName("com.google.android.gms.tapandpay.TapAndPay")
      val getClientMethod = tapAndPayClass.getMethod(
        "getClient",
        Activity::class.java)
      val client = getClientMethod.invoke(null, activity)

      val tapAndPayClientClass = Class.forName("com.google.android.gms.tapandpay.TapAndPayClient")
      val listTokensMethod = tapAndPayClientClass.getMethod("listTokens")

      listTokensMethod.invoke(client) as Task<List<Any>>
    } catch (e: Exception) {
      Log.e(TAG, "Google TapAndPay dependency not found")
      null
    }
  }

  internal fun isTokenInWallet(token: Any, newLastFour: String): Boolean {
    return try {
      val getFpanLastFourMethod = Class.forName("com.google.android.gms.tapandpay.issuer.TokenInfo").getMethod("getFpanLastFour")
      val existingFpanLastFour = getFpanLastFourMethod.invoke(token) as String
      existingFpanLastFour == newLastFour
    } catch (e: Exception) {
      Log.e(TAG, "There was a problem finding the class com.google.android.gms.tapandpay.issuer.TokenInfo. Make sure you've included Google's TapAndPay dependency.")
      false
    }
  }


  fun findExistingToken(activity: Activity, newCardLastFour: String, callback: TokenCheckHandler) {
    val tokens = getTapandPayTokens(activity)
    if (tokens == null) {
      callback(false, null, createError("Failed", "Google TapAndPay dependency not found."))
      return
    }

    tokens.addOnCompleteListener { task ->
      if (task.isSuccessful) {
        for (token in task.result) {
          if (isTokenInWallet(token, newCardLastFour)) {
            callback(true,  mapFromTokenInfo(token), null)
            return@addOnCompleteListener
          }
        }
      } else {
        Log.e(TAG, "Unable to fetch existing tokens from Google TapAndPay.")
      }
      callback(false, null, null)
    }
  }

  fun tokenize(activity: Activity, tokenReferenceId: String, token: ReadableMap, cardDescription: String) {
    try {
      val tapAndPayClientClass = Class.forName("com.google.android.gms.tapandpay.TapAndPayClient")
      val tokenizeMethod = tapAndPayClientClass::class.java.getMethod("tokenize", Activity::class.java, String::class.java, Int::class.java, String::class.java, Int::class.java, Int::class.java)
      tokenizeMethod.invoke(tapAndPayClient,
                            activity,
                            tokenReferenceId,
                            token.getInt("serviceProvider"),
                            cardDescription,
                            token.getInt("network"),
                            REQUEST_CODE_TOKENIZE)
    } catch (e: Exception) {
      Log.e(TAG, "Google TapAndPay dependency not found.")
    }
  }

  private fun mapFromTokenInfo(token: Any?): WritableMap {
    val result = WritableNativeMap()
    token?.let {
      try {
        val tokenInfoClass = Class.forName("com.google.android.gms.tapandpay.issuer.TokenInfo")
        result.putString(
          "id",
          tokenInfoClass.getMethod("getIssuerTokenId").invoke(it) as String)
        result.putString(
          "cardLastFour",
          tokenInfoClass.getMethod("getFpanLastFour").invoke(it) as String)
        result.putString(
          "issuer",
          tokenInfoClass.getMethod("getIssuerName").invoke(it) as String)
        result.putString(
          "status",
          mapFromTokenState(tokenInfoClass.getMethod("getTokenState").invoke(it) as Int))
        result.putInt(
          "network",
          tokenInfoClass.getMethod("getNetwork").invoke(it) as Int)
        result.putInt(
          "serviceProvider",
          tokenInfoClass.getMethod("getTokenServiceProvider").invoke(it) as Int)
      } catch (e: Exception) {
        Log.e(TAG,
          "There was a problem finding the class com.google.android.gms.tapandpay.issuer.TokenInfo. Make sure you've included Google's TapAndPay dependency.")
      }
    }
    return result
  }

  private fun mapFromTokenState(status: Int): String {
    try {
      val tapAndPayClass = Class.forName("com.google.android.gms.tapandpay.TapAndPay")
      return when (status) {
        tapAndPayClass.getField("TOKEN_STATE_NEEDS_IDENTITY_VERIFICATION").get(tapAndPayClass) -> "TOKEN_STATE_NEEDS_IDENTITY_VERIFICATION"
        tapAndPayClass.getField("TOKEN_STATE_PENDING").get(tapAndPayClass) -> "TOKEN_STATE_PENDING"
        tapAndPayClass.getField("TOKEN_STATE_SUSPENDED").get(tapAndPayClass) -> "TOKEN_STATE_SUSPENDED"
        tapAndPayClass.getField("TOKEN_STATE_ACTIVE").get(tapAndPayClass) -> "TOKEN_STATE_ACTIVE"
        tapAndPayClass.getField("TOKEN_STATE_FELICA_PENDING_PROVISIONING").get(tapAndPayClass) -> "TOKEN_STATE_FELICA_PENDING_PROVISIONING"
        tapAndPayClass.getField("TOKEN_STATE_UNTOKENIZED").get(tapAndPayClass) -> "TOKEN_STATE_UNTOKENIZED"
        else -> "UNKNOWN"
      }
    } catch (e: Exception) {
      Log.e(TAG,
            "There was a problem finding Google's TapAndPay dependency.")
      return "UNKNOWN"
    }
  }
}
