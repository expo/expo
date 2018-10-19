package abi29_0_0.host.exp.exponent.modules.api.components.payments.util;
import com.stripe.android.model.Card;

public class Utils {

  public static String validateCard(final Card card) {
    if (!card.validateNumber()) {
      return "The card number that you entered is invalid";
    } else if (!card.validateExpiryDate()) {
      return "The expiration date that you entered is invalid";
    } else if (!card.validateCVC()) {
      return "The CVC code that you entered is invalid";
    }
    return null;
  }

}
