package expo.modules.speech;

import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

// Lazy load the ISO codes into a Map then transform the codes to match other localization patterns in Expo
public class LanguageUtils {

  private static Map<String, Locale> countryISOCodes;

  private static Map<String, Locale> languageISOCodes;

  private static String transformCountryISO(String code) {
    if (countryISOCodes == null) {
      String[] countries = Locale.getISOCountries();
      countryISOCodes = new HashMap<>(countries.length);
      for (String country : countries) {
        Locale locale = new Locale("", country);
        countryISOCodes.put(locale.getISO3Country().toUpperCase(), locale);
      }
    }
    return countryISOCodes.get(code).getCountry();
  }

  private static String transformLanguageISO(String code) {
    if (languageISOCodes == null) {
      String[] languages = Locale.getISOLanguages();
      languageISOCodes = new HashMap<>(languages.length);
      for (String language : languages) {
        Locale locale = new Locale(language);
        languageISOCodes.put(locale.getISO3Language(), locale);
      }
    }
    return languageISOCodes.get(code).getLanguage();
  }

  static String getISOCode(Locale locale) {
    String language = transformLanguageISO(locale.getISO3Language());
    String country = locale.getISO3Country();
    if (!country.equals("")) {
      String countryCode = transformCountryISO(country);
      language += "-" + countryCode;
    }
    return language;
  }
}

