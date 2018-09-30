package expo.modules.localization;

import android.app.Activity;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.res.Configuration;
import android.os.Build;
import android.os.Bundle;
import android.os.LocaleList;
import android.text.TextUtils;
import android.view.View;

import java.util.ArrayList;
import java.util.Currency;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.TimeZone;

import expo.core.ExportedModule;
import expo.core.ModuleRegistry;
import expo.core.interfaces.ActivityProvider;
import expo.core.interfaces.ModuleRegistryConsumer;
import expo.core.interfaces.services.EventEmitter;

import static android.content.Intent.ACTION_LOCALE_CHANGED;
import static android.os.Build.VERSION.SDK_INT;
import static android.os.Build.VERSION_CODES.LOLLIPOP;
import static android.os.Build.VERSION_CODES.N;
import static java.util.Currency.getAvailableCurrencies;


public class LocalizationModule extends ExportedModule implements ModuleRegistryConsumer {

    private LocalesBroadcastReceiver mReceiver;
    private ModuleRegistry mModuleRegistry;
    private EventEmitter mEventEmitter;

    public LocalizationModule(Context context) {
        super(context);
    }

    private final Context getApplicationContext() {
        return getCurrentActivity().getApplicationContext();
    }

    private Activity getCurrentActivity() {
        ActivityProvider activityProvider = mModuleRegistry.getModule(ActivityProvider.class);
        return activityProvider.getCurrentActivity();
    }

    @Override
    public String getName() {
        return "ExpoLocalization";
    }

    @Override
    public void setModuleRegistry(ModuleRegistry moduleRegistry) {
        if (mReceiver != null) {
            getApplicationContext().unregisterReceiver(mReceiver);
            mReceiver = null;
        }

        mEventEmitter = moduleRegistry.getModule(EventEmitter.class);
        mModuleRegistry = moduleRegistry;

        mReceiver = new LocalesBroadcastReceiver();
        getApplicationContext().registerReceiver(mReceiver, new IntentFilter(ACTION_LOCALE_CHANGED));
    }

    @Override
    public Map<String, Object> getConstants() {
        HashMap<String, Object> constants = new HashMap<>();

        ArrayList<Locale> locales = getLocales();
        ArrayList<String> localeNames = getLocaleNames(locales);
        Boolean isRTL = TextUtils.getLayoutDirectionFromLocale(Locale.getDefault())== View.LAYOUT_DIRECTION_RTL;

        constants.put("isRTL", isRTL);
        constants.put("locale", localeNames.get(0));
        constants.put("locales", localeNames);
        constants.put("timezone", TimeZone.getDefault().getID());
        constants.put("isoCurrencyCodes", getISOCurrencyCodes());
        constants.put("country", locales.get(0).getCountry());

        return constants;
    }

    private Bundle getBundledConstants() {
        Bundle constants = new Bundle();

        ArrayList<Locale> locales = getLocales();
        ArrayList<String> localeNames = getLocaleNames(locales);
        Boolean isRTL = TextUtils.getLayoutDirectionFromLocale(Locale.getDefault())== View.LAYOUT_DIRECTION_RTL;

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
        for (Currency handle : availableCurrencies) locales.add(handle.getCurrencyCode());
        return locales;
    }

    private ArrayList<Locale> getLocales() {
        ArrayList<Locale> locales = new ArrayList<>();

        Configuration configuration = getApplicationContext().getResources().getConfiguration();
        if (SDK_INT >= N) {
            LocaleList localeList = configuration.getLocales();
            for (int i = 0; i < localeList.size(); i++)
                locales.add(localeList.get(i));
        } else {
            locales.add(configuration.locale);
        }

        return locales;
    }

    private ArrayList<String> getLocaleNames(ArrayList<Locale> locales) {
        ArrayList<String> localeNames = new ArrayList<>();
        for (int i = 0; i < locales.size(); i++) localeNames.add(toLocaleTag(locales.get(i)));
        return localeNames;
    }

    private String toLocaleTag(Locale locale) {
        String localeTag;

        if (SDK_INT >= LOLLIPOP) {
            localeTag = locale.toLanguageTag();
        } else {
            StringBuilder builder = new StringBuilder();
            builder.append(locale.getLanguage());
            if (locale.getCountry() != null) {
                builder.append("-");
                builder.append(locale.getCountry());
            }
            localeTag = builder.toString();
        }

        if (localeTag.matches("^(iw|in|ji).*")) {
            localeTag = localeTag
                    .replace("iw", "he")
                    .replace("in", "id")
                    .replace("ji", "yi");
        }

        return localeTag;
    }

    private void onLocaleUpdated() {
        mEventEmitter.emit("Expo.onLocaleUpdated", getBundledConstants());
    }

    private class LocalesBroadcastReceiver extends BroadcastReceiver {

        @Override
        public void onReceive(Context context, Intent intent) {
            if (intent.getAction().equals(ACTION_LOCALE_CHANGED)) onLocaleUpdated();
        }
    }
}