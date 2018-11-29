package expo.modules.payments.stripe.util;

/**
 * Created by ngoriachev on 13/03/2018.
 */

public abstract class PayParams {

  public static final String CURRENCY_CODE = "currency_code";
  public static final String BILLING_ADDRESS_REQUIRED = "billing_address_required";
  public static final String SHIPPING_ADDRESS_REQUIRED = "shipping_address_required";
  public static final String PHONE_NUMBER_REQUIRED = "phone_number_required";
  public static final String TOTAL_PRICE = "total_price";
  public static final String UNIT_PRICE = "unit_price";
  public static final String LINE_ITEMS = "line_items";
  public static final String QUANTITY = "quantity";
  public static final String DESCRIPTION = "description";

}
