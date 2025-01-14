import * as Localization from "expo-localization";
import { I18nManager } from "react-native";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import "intl-pluralrules";
import resources from "./resources";

export const fallbackLocale = "en-US";

const systemLocales = Localization.getLocales();

const supportedTags = Object.keys(resources);

// Checks to see if the device locale matches any of the supported locales
// Device locale may be more specific and still match (e.g., en-US matches en)
const systemTagMatchesSupportedTags = (deviceTag: string) => {
  const primaryTag = deviceTag.split("-")[0];
  console.log({ primaryTag });
  return supportedTags.includes(primaryTag);
};

const pickSupportedLocale: () => Localization.Locale | undefined = () => {
  return systemLocales.find((locale) =>
    systemTagMatchesSupportedTags(locale.languageTag),
  );
};

export const locale = pickSupportedLocale();

export let isRTL = false;

// Need to set RTL ASAP to ensure the app is rendered correctly. Waiting for i18n to init is too late.
if (locale?.languageTag && locale?.textDirection === "rtl") {
  I18nManager.allowRTL(true);
  isRTL = true;
} else {
  I18nManager.allowRTL(false);
}

export const lng = locale?.languageTag ?? fallbackLocale;

export const initI18n = async () => {
  i18n.use(initReactI18next);

  await i18n.init({
    resources,
    lng,
    fallbackLng: fallbackLocale,
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false, // Prevents React Suspense issues
    },
  });

  console.log(`[initI18n] i18n initialized with language: ${i18n.language}`);
};
