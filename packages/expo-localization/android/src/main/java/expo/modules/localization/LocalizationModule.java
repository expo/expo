package expo.modules.localization;

import android.content.Context;
import android.content.res.Configuration;
import android.os.Bundle;
import android.os.LocaleList;
import android.text.TextUtils;
import android.view.View;

import java.lang.ref.WeakReference;
import java.lang.reflect.Method;
import java.text.DecimalFormatSymbols;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Currency;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.TimeZone;

import expo.modules.core.ExportedModule;
import expo.modules.core.Promise;
import expo.modules.core.interfaces.ExpoMethod;

import static android.os.Build.VERSION.SDK_INT;
import static android.os.Build.VERSION_CODES.N;
import static java.util.Currency.getAvailableCurrencies;

public class LocalizationModule extends ExportedModule {
  private WeakReference<Context> mContextRef;

  private static final List<String> USES_IMPERIAL = Arrays.asList("US", "LR", "MM");

  public LocalizationModule(Context context) {
    super(context);
    mContextRef = new WeakReference<>(context);
  }

  private final Context getApplicationContext() {
    Context context = mContextRef.get();
    return context != null ? context.getApplicationContext() : null;
  }

  @Override
  public String getName() {
    return "ExpoLocalization";
  }

  @Override
  public Map<String, Object> getConstants() {
    HashMap<String, Object> constants = new HashMap<>();

    Bundle bundle = getBundledConstants();
    for (String key : bundle.keySet()) {
      constants.put(key, bundle.get(key));
    }
    return constants;
  }

  @ExpoMethod
  public void getLocalizationAsync(Promise promise) {
    promise.resolve(getBundledConstants());
  }

  // TODO: Bacon: add set language

  private Bundle getBundledConstants() {
    Bundle constants = new Bundle();

    Locale locale = Locale.getDefault();
    ArrayList<Locale> locales = getLocales();
    ArrayList<String> localeNames = getLocaleNames(locales);
    Boolean isRTL = TextUtils.getLayoutDirectionFromLocale(locale) == View.LAYOUT_DIRECTION_RTL;
    String region = getRegionCode(locale);
    DecimalFormatSymbols symbols = new DecimalFormatSymbols(locale);

    constants.putString("currency", getCurrencyCode(locale));
    constants.putString("decimalSeparator", String.valueOf(symbols.getDecimalSeparator()));
    constants.putString("digitGroupingSeparator", String.valueOf(symbols.getGroupingSeparator()));
    constants.putStringArrayList("isoCurrencyCodes", getISOCurrencyCodes());
    constants.putBoolean("isMetric", !USES_IMPERIAL.contains(region));
    constants.putBoolean("isRTL", isRTL);
    constants.putString("locale", localeNames.get(0));
    constants.putStringArrayList("locales", localeNames);
    constants.putString("region", region);
    constants.putString("timezone", TimeZone.getDefault().getID());

    return constants;
  }

  private static ArrayList<String> getISOCurrencyCodes() {
    ArrayList<String> locales = new ArrayList<>();
    final Set<Currency> availableCurrencies = getAvailableCurrencies();
    for (Currency handle : availableCurrencies) {
      locales.add(handle.getCurrencyCode());
    }
    return locales;
  }

  private ArrayList<Locale> getLocales() {
    ArrayList<Locale> locales = new ArrayList<>();

    Context context = getApplicationContext();
    if (context == null) {
      return null;
    }
    Configuration configuration = context.getResources().getConfiguration();
    if (SDK_INT > N) {
      LocaleList localeList = configuration.getLocales();
      for (int i = 0; i < localeList.size(); i++) {
        locales.add(localeList.get(i));
      }
    } else {
      locales.add(configuration.locale);
    }
    return locales;
  }

  private static ArrayList<String> getLocaleNames(ArrayList<Locale> locales) {
    ArrayList<String> languages = new ArrayList<>();
    for (Locale locale : locales) {
      // https://stackoverflow.com/a/46652446/4047926
      languages.add(locale.toLanguageTag());
    }
    return languages;
  }

  private String getRegionCode(Locale locale) {
    String miuiRegion = getSystemProperty("ro.miui.region");
    if (!TextUtils.isEmpty(miuiRegion)) {
      return miuiRegion;
    }
    return getCountryCode(locale);
  }

  private static String getCountryCode(Locale locale) {
    try {
      String country = locale.getCountry();
      return TextUtils.isEmpty(country) ? null : country;
    } catch (Exception ignored) {
      return null;
    }
  }

  private static String getSystemProperty(String key) {
    try {
      Class<?> systemProperties = Class.forName("android.os.SystemProperties");
      Method get = systemProperties.getMethod("get", String.class);
      return (String) get.invoke(systemProperties, key);
    } catch (Exception ignored) {
      return "";
    }
  }

  private static String getCurrencyCode(Locale locale){
    try {
      Currency currency = Currency.getInstance(locale);
      return currency == null ? null : currency.getCurrencyCode();
    } catch (Exception ignored) {
      return null;
    }
  }
}
