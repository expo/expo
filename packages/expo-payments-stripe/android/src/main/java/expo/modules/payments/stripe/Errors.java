package expo.modules.payments.stripe;

import android.support.annotation.NonNull;

import java.util.HashMap;
import java.util.Map;

import expo.modules.payments.stripe.util.ArgCheck;

/**
 * Created by ngoriachev on 30/07/2018.
 */

public final class Errors {
  private static final Map<String, String> exceptionNameToErrorCode = new HashMap<>();

  static {
    exceptionNameToErrorCode.put("APIConnectionException", "apiConnection");
    exceptionNameToErrorCode.put("StripeException", "stripe");
    exceptionNameToErrorCode.put("CardException", "card");
    exceptionNameToErrorCode.put("AuthenticationException", "authentication");
    exceptionNameToErrorCode.put("PermissionException", "permission");
    exceptionNameToErrorCode.put("InvalidRequestException", "invalidRequest");
    exceptionNameToErrorCode.put("RateLimitException", "rateLimit");
    exceptionNameToErrorCode.put("APIException", "api");
    exceptionNameToErrorCode.put("ApiException", "api");
  }

  static String toErrorCode(@NonNull Exception exception) {
    ArgCheck.nonNull(exception);
    String simpleName = exception.getClass().getSimpleName();
    String errorCode = exceptionNameToErrorCode.get(simpleName);
    ArgCheck.nonNull(errorCode, simpleName);
    return errorCode;
  }

  static String getErrorCode(@NonNull Map<String, Object> errorCodes, @NonNull String errorKey) {
    Object errorMap = errorCodes.get(errorKey);
    if (errorMap instanceof Map) {
      Object errorCode = ((Map) errorMap).get("errorCode");
      if (errorCode instanceof String) {
        return (String) errorCode;
      }
    }
    return null;
  }

  static String getDescription(@NonNull Map<String, Object> errorCodes, @NonNull String errorKey) {
    Object errorMap = errorCodes.get(errorKey);
    if (errorMap instanceof Map) {
      Object description = ((Map) errorMap).get("description");
      if (description instanceof String) {
        return (String) description;
      }
    }
    return null;
  }
}