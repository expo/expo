package com.gettipsi.stripe.util;

import com.stripe.android.model.Card;

/**
 * Created by dmitriy on 11/25/16
 */

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
