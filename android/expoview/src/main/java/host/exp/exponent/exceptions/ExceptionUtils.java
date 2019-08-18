// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.exceptions;

import android.content.Context;
import android.provider.Settings;

import java.net.ConnectException;
import java.net.SocketTimeoutException;
import java.net.UnknownHostException;

import host.exp.exponent.network.ExponentNetwork;
import host.exp.exponent.kernel.ExponentErrorMessage;
import host.exp.expoview.Exponent;

public class ExceptionUtils {

  // Converts an exception into and ExponentErrorMessage, which contains both a user facing
  // error message and a developer facing error message.
  // Example:
  //   ManifestException with
  //     manifestUrl="exp://exp.host/@exponent/pomodoro"
  //     originalException=UnknownHostException
  //
  //   turns into:
  //
  //   ExponentErrorMessage with
  //     userErrorMessage="Could not load exp://exp.host/@exponent/pomodoro. Airplane mode is on."
  //     developerErrorMessage="java.net.UnknownHostException: Unable to resolve host"
  public static ExponentErrorMessage exceptionToErrorMessage(final Exception exception) {
    final Context context = Exponent.getInstance().getApplication();
    final ExponentErrorMessage defaultResponse = ExponentErrorMessage.developerErrorMessage(exception.toString());
    if (context == null) {
      return defaultResponse;
    }


    if (exception instanceof ExponentException) {
      // Grab both the user facing message from ExponentException
      String message = exception.toString();

      // Append general exception error messages if applicable
      ExponentException typedException = (ExponentException) exception;
      if (typedException.originalException() != null) {
        String userErrorMessage = getUserErrorMessage(typedException.originalException(), context);
        if (userErrorMessage != null) {
          message += " " + userErrorMessage;
        }
      }

      return new ExponentErrorMessage(message, typedException.originalExceptionMessage());
    }

    String userErrorMessage = getUserErrorMessage(exception, context);
    if (userErrorMessage != null) {
      return defaultResponse.addUserErrorMessage(userErrorMessage);
    }

    return defaultResponse;
  }

  private static String getUserErrorMessage(final Exception exception, final Context context) {
    if (exception instanceof UnknownHostException || exception instanceof ConnectException) {
      if (isAirplaneModeOn(context)) {
        return "Airplane mode is on. Please turn off and try again.";
      } else if (!ExponentNetwork.isNetworkAvailable(context)) {
        return "Can't connect to internet. Please try again.";
      }
    } else if (exception instanceof SocketTimeoutException) {
      return "Network response timed out.";
    }

    return null;
  }

  private static boolean isAirplaneModeOn(final Context context) {
    return Settings.System.getInt(context.getContentResolver(), Settings.Global.AIRPLANE_MODE_ON, 0) != 0;
  }
}
