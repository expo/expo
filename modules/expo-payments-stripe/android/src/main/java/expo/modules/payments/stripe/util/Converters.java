package expo.modules.payments.stripe.util;

import android.os.Bundle;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;
import android.text.TextUtils;

import com.google.android.gms.identity.intents.model.CountrySpecification;
import com.google.android.gms.identity.intents.model.UserAddress;
import com.google.android.gms.wallet.PaymentData;
import com.stripe.android.model.Address;
import com.stripe.android.model.BankAccount;
import com.stripe.android.model.Card;
import com.stripe.android.model.Source;
import com.stripe.android.model.SourceCodeVerification;
import com.stripe.android.model.SourceOwner;
import com.stripe.android.model.SourceReceiver;
import com.stripe.android.model.SourceRedirect;
import com.stripe.android.model.Token;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;

/**
 * Created by ngoriachev on 13/03/2018.
 */

public class Converters {

  public static Bundle convertTokenToWritableMap(Token token) {
    Bundle newToken = new Bundle();

    if (token == null) return newToken;

    newToken.putString("tokenId", token.getId());
    newToken.putBoolean("livemode", token.getLivemode());
    newToken.putBoolean("used", token.getUsed());
    newToken.putDouble("created", token.getCreated().getTime());

    if (token.getCard() != null) {
      newToken.putBundle("card", convertCardToWritableMap(token.getCard()));
    }
    if (token.getBankAccount() != null) {
      newToken.putBundle("bankAccount", convertBankAccountToWritableMap(token.getBankAccount()));
    }

    return newToken;
  }

  public static Bundle putExtraToTokenMap(final Bundle tokenMap, UserAddress billingAddress, UserAddress shippingAddress) {
    ArgCheck.nonNull(tokenMap);

    Bundle extra = new Bundle();

    extra.putBundle("billingContact", convertAddressToWritableMap(billingAddress));
    extra.putBundle("shippingContact", convertAddressToWritableMap(shippingAddress));
    tokenMap.putBundle("extra", extra);

    return tokenMap;
  }

  private static Bundle convertCardToWritableMap(final Card card) {
    Bundle result = new Bundle();

    if (card == null) return result;

    result.putString("cardId", card.getId());
    result.putString("number", card.getNumber());
    result.putString("cvc", card.getCVC() );
    result.putInt("expMonth", card.getExpMonth() );
    result.putInt("expYear", card.getExpYear() );
    result.putString("name", card.getName() );
    result.putString("addressLine1", card.getAddressLine1() );
    result.putString("addressLine2", card.getAddressLine2() );
    result.putString("addressCity", card.getAddressCity() );
    result.putString("addressState", card.getAddressState() );
    result.putString("addressZip", card.getAddressZip() );
    result.putString("addressCountry", card.getAddressCountry() );
    result.putString("last4", card.getLast4() );
    result.putString("brand", card.getBrand() );
    result.putString("funding", card.getFunding() );
    result.putString("fingerprint", card.getFingerprint() );
    result.putString("country", card.getCountry() );
    result.putString("currency", card.getCurrency() );

    return result;
  }

  public static Bundle convertBankAccountToWritableMap(BankAccount account) {
    Bundle result = new Bundle();

    if (account == null) return result;

    result.putString("routingNumber", account.getRoutingNumber());
    result.putString("accountNumber", account.getAccountNumber());
    result.putString("countryCode", account.getCountryCode());
    result.putString("currency", account.getCurrency());
    result.putString("accountHolderName", account.getAccountHolderName());
    result.putString("accountHolderType", account.getAccountHolderType());
    result.putString("fingerprint", account.getFingerprint());
    result.putString("bankName", account.getBankName());
    result.putString("last4", account.getLast4());

    return result;
  }

  public static String getValue(final Map<String, Object> map, final String key, final String def) {
    if (map.containsKey(key)) {
      return (String)map.get(key);
    } else {
      // If map don't have some key - we must pass to constructor default value.
      return def;
    }
  }

  public static Boolean getValue(final Map<String, Object> map, final String key, final Boolean def) {
    if (map.containsKey(key)) {
      return (Boolean)map.get(key);
    } else {
      // If map don't have some key - we must pass to constructor default value.
      return def;
    }
  }

  public static List<Object> getValue(final Map<String, Object> map, final String key, final List<Object> def) {
    if (map.containsKey(key)) {
      return (List<Object>)map.get(key);
    } else {
      // If map don't have some key - we must pass to constructor default value.
      return def;
    }
  }

  public static String getValue(final Map<String, Object> map, final String key) {
    return getValue(map, key, (String) null);
  }

  public static Collection<String> getAllowedShippingCountryCodes(final Map<String, Object> map) {
    ArrayList<String> allowedCountryCodesForShipping = new ArrayList<>();
    List<Object> countries = getValue(map, "shipping_countries", (List<Object>) null);

    if (countries != null){
      for (int i = 0; i < countries.size(); i++) {
        String code = (String)countries.get(i);
        allowedCountryCodesForShipping.add(code);
      }
    }

    return allowedCountryCodesForShipping;
  }

  public static ArrayList<CountrySpecification> getAllowedShippingCountries(final Map<String, Object> map) {
    ArrayList<CountrySpecification> allowedCountriesForShipping = new ArrayList<>();
    List<Object> countries = getValue(map, "shipping_countries", (List<Object>) null);

    if (countries != null){
      for (int i = 0; i < countries.size(); i++) {
        String code = (String)countries.get(i);
        allowedCountriesForShipping.add(new CountrySpecification(code));
      }
    }

    return allowedCountriesForShipping;
  }

  public static Card createCard(final Map<String, Object> cardData) {
    return new Card(
      // required fields
        (String)cardData.get("number"),
        new Integer((int)Math.round((Double)cardData.get("expMonth"))),
        new Integer((int)Math.round((Double)cardData.get("expYear"))),
      // additional fields
      getValue(cardData, "cvc"),
      getValue(cardData, "name"),
      getValue(cardData, "addressLine1"),
      getValue(cardData, "addressLine2"),
      getValue(cardData, "addressCity"),
      getValue(cardData, "addressState"),
      getValue(cardData, "addressZip"),
      getValue(cardData, "addressCountry"),
      getValue(cardData, "brand"),
      getValue(cardData, "last4"),
      getValue(cardData, "fingerprint"),
      getValue(cardData, "funding"),
      getValue(cardData, "country"),
      getValue(cardData, "currency"),
      getValue(cardData, "id")
    );
  }



  @NonNull
  public static Bundle convertSourceToWritableMap(@Nullable Source source) {
    Bundle newSource = new Bundle();

    if (source == null) {
      return newSource;
    }

    newSource.putString("sourceId", source.getId());
    newSource.putInt("amount", source.getAmount().intValue());
    newSource.putInt("created", source.getCreated().intValue());
    newSource.putBundle("codeVerification", convertCodeVerificationToWritableMap(source.getCodeVerification()));
    newSource.putString("currency", source.getCurrency());
    newSource.putString("flow", source.getFlow());
    newSource.putBoolean("livemode", source.isLiveMode());
    newSource.putBundle("metadata", stringMapToWritableMap(source.getMetaData()));
    newSource.putBundle("owner", convertOwnerToWritableMap(source.getOwner()));
    newSource.putBundle("receiver", convertReceiverToWritableMap(source.getReceiver()));
    newSource.putBundle("redirect", convertRedirectToWritableMap(source.getRedirect()));
    newSource.putBundle("sourceTypeData", mapToWritableMap(source.getSourceTypeData()));
    newSource.putString("status", source.getStatus());
    newSource.putString("type", source.getType());
    newSource.putString("typeRaw", source.getTypeRaw());
    newSource.putString("usage", source.getUsage());

    return newSource;
  }

  @NonNull
  public static Bundle stringMapToWritableMap(@Nullable Map<String, String> map) {
    Bundle writableMap = new Bundle();

    if (map == null) {
      return writableMap;
    }

    for (Map.Entry<String, String> entry : map.entrySet()) {
      writableMap.putString(entry.getKey(), entry.getValue());
    }

    return writableMap;
  }

  @NonNull
  public static Bundle convertOwnerToWritableMap(@Nullable final SourceOwner owner) {
    Bundle map = new Bundle();

    if (owner == null) {
      return map;
    }

    map.putBundle("address", convertAddressToWritableMap(owner.getAddress()));
    map.putString("email", owner.getEmail());
    map.putString("name", owner.getName());
    map.putString("phone", owner.getPhone());
    map.putString("verifiedEmail", owner.getVerifiedEmail());
    map.putString("verifiedPhone", owner.getVerifiedPhone());
    map.putString("verifiedName", owner.getVerifiedName());
    map.putBundle("verifiedAddress", convertAddressToWritableMap(owner.getVerifiedAddress()));

    return map;
  }

  @NonNull
  public static Bundle convertAddressToWritableMap(@Nullable final Address address) {
    Bundle map = new Bundle();

    if (address == null) {
      return map;
    }

    map.putString("city", address.getCity());
    map.putString("country", address.getCountry());
    map.putString("line1", address.getLine1());
    map.putString("line2", address.getLine2());
    map.putString("postalCode", address.getPostalCode());
    map.putString("state", address.getState());

    return map;
  }

  @NonNull
  public static Bundle convertReceiverToWritableMap(@Nullable final SourceReceiver receiver) {
    Bundle map = new Bundle();

    if (receiver == null) {
      return map;
    }

    map.putInt("amountCharged", (int) receiver.getAmountCharged());
    map.putInt("amountReceived", (int) receiver.getAmountReceived());
    map.putInt("amountReturned", (int) receiver.getAmountReturned());
    map.putString("address", receiver.getAddress());

    return map;
  }

  @NonNull
  public static Bundle convertRedirectToWritableMap(@Nullable SourceRedirect redirect) {
    Bundle map = new Bundle();

    if (redirect == null) {
      return map;
    }

    map.putString("returnUrl", redirect.getReturnUrl());
    map.putString("status", redirect.getStatus());
    map.putString("url", redirect.getUrl());

    return map;
  }

  @NonNull
  public static Bundle convertCodeVerificationToWritableMap(@Nullable SourceCodeVerification codeVerification) {
    Bundle map = new Bundle();

    if (codeVerification == null) {
      return map;
    }

    map.putInt("attemptsRemaining", codeVerification.getAttemptsRemaining());
    map.putString("status", codeVerification.getStatus());

    return map;
  }

  @NonNull
  public static Bundle mapToWritableMap(@Nullable Map<String, Object> map){
    Bundle bundle = new Bundle();

    if (map == null) {
      return bundle;
    }

    for (String key: map.keySet()) {
      pushRightTypeToMap(bundle, key, map.get(key));
    }

    return bundle;
  }

  public static void pushRightTypeToMap(@NonNull Bundle map, @NonNull String key, @NonNull Object object) {
    Class argumentClass = object.getClass();
    if (argumentClass == Boolean.class) {
      map.putBoolean(key, (Boolean) object);
    } else if (argumentClass == Integer.class) {
      map.putDouble(key, ((Integer)object).doubleValue());
    } else if (argumentClass == Double.class) {
      map.putDouble(key, (Double) object);
    } else if (argumentClass == Float.class) {
      map.putDouble(key, ((Float)object).doubleValue());
    } else if (argumentClass == String.class) {
      map.putString(key, object.toString());
    } else if (argumentClass == Bundle.class) {
      map.putBundle(key, (Bundle)object);
    } else {
      if(object != null) {
        map.putString(key, object.toString());
      }
    }
  }

  public static Bundle convertAddressToWritableMap(final UserAddress address){
    Bundle result = new Bundle();

    if (address == null) return result;

    putIfNotEmpty(result, "address1", address.getAddress1());
    putIfNotEmpty(result, "address2", address.getAddress2());
    putIfNotEmpty(result, "address3", address.getAddress3());
    putIfNotEmpty(result, "address4", address.getAddress4());
    putIfNotEmpty(result, "address5", address.getAddress5());
    putIfNotEmpty(result, "administrativeArea", address.getAdministrativeArea());
    putIfNotEmpty(result, "companyName", address.getCompanyName());
    putIfNotEmpty(result, "countryCode", address.getCountryCode());
    putIfNotEmpty(result, "locality", address.getLocality());
    putIfNotEmpty(result, "name", address.getName());
    putIfNotEmpty(result, "phoneNumber", address.getPhoneNumber());
    putIfNotEmpty(result, "postalCode", address.getPostalCode());
    putIfNotEmpty(result, "sortingCode", address.getSortingCode());

    return result;
  }

  public static BankAccount createBankAccount(Map<String, Object> accountData) {
    BankAccount account = new BankAccount(
      // required fields only
        (String)accountData.get("accountNumber"),
        (String)accountData.get("countryCode"),
        (String)accountData.get("currency"),
      getValue(accountData, "routingNumber", "")
    );
    account.setAccountHolderName(getValue(accountData, "accountHolderName"));
    account.setAccountHolderType(getValue(accountData, "accountHolderType"));

    return account;
  }

  public static String getStringOrNull(@NonNull Map<String, Object> map, @NonNull String key) {
    return map.containsKey(key) ? (String)map.get(key) : null;
  }

  public static void putIfNotEmpty(final Bundle map, final String key, final String value) {
    if (!TextUtils.isEmpty(value)) {
      map.putString(key, value);
    }
  }

  public static UserAddress getBillingAddress(PaymentData paymentData) {
    if (paymentData != null && paymentData.getCardInfo() != null) {
      return paymentData.getCardInfo().getBillingAddress();
    }

    return null;
  }

}
