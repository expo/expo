package expo.modules.localization;

import android.content.Context;
import android.content.res.Configuration;
import android.os.Bundle;
import android.os.LocaleList;
import android.text.TextUtils;
import android.view.View;

import java.lang.ref.WeakReference;
import java.util.ArrayList;
import java.util.Currency;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.TimeZone;

import expo.core.ExportedModule;
import expo.core.Promise;
import expo.core.interfaces.ExpoMethod;

import static android.os.Build.VERSION.SDK_INT;
import static android.os.Build.VERSION_CODES.LOLLIPOP;
import static android.os.Build.VERSION_CODES.N;
import static java.util.Currency.getAvailableCurrencies;

public class LocalizationModule extends ExportedModule {
    private WeakReference<Context> mContextRef;

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

    private Bundle getBundledConstants() {
        Bundle constants = new Bundle();

        ArrayList<Locale> locales = getLocales();
        ArrayList<String> localeNames = getLocaleNames(locales);
        Boolean isRTL = TextUtils.getLayoutDirectionFromLocale(Locale.getDefault()) == View.LAYOUT_DIRECTION_RTL;

        constants.putBoolean("isRTL", isRTL);
        constants.putString("locale", localeNames.get(0));
        constants.putStringArrayList("locales", localeNames);
        constants.putString("timezone", TimeZone.getDefault().getID());
        constants.putStringArrayList("isoCurrencyCodes", getISOCurrencyCodes());
        constants.putString("country", locales.get(0).getCountry());

        return constants;
    }

    private ArrayList<String> getISOCurrencyCodes() {
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
        if (context != null) {
            Configuration configuration = context.getResources().getConfiguration();
            if (SDK_INT >= N) {
                LocaleList localeList = configuration.getLocales();
                for (int i = 0; i < localeList.size(); i++) {
                    locales.add(localeList.get(i));
                }
            } else {
                locales.add(configuration.locale);
            }
        }


        return locales;
    }

    private ArrayList<String> getLocaleNames(ArrayList<Locale> locales) {
        ArrayList<String> localeNames = new ArrayList<>();
        for (int i = 0; i < locales.size(); i++) localeNames.add(toLocaleTag(locales.get(i)));
        return localeNames;
    }

    private String toLocaleTag(Locale locale) {
        String localeTag = locale.toLanguageTag();

        if (localeTag.matches("^(iw|in|ji).*")) {
            localeTag = localeTag
                    .replace("iw", "he")
                    .replace("in", "id")
                    .replace("ji", "yi");
        }

        return localeTag;
    }

}
