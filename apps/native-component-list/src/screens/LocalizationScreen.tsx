import * as Localization from 'expo-localization';
import i18n from 'i18n-js';
import { ScrollView, StyleSheet, View } from 'react-native';

import HeadingText from '../components/HeadingText';
import MonoText from '../components/MonoText';

i18n.fallbacks = true;
i18n.locale = Localization.getLocales()[0].languageTag;
i18n.translations = {
  en: {
    phrase: 'Hello my friend',
    default: 'English language only',
  },
  es: {
    phrase: 'Hola mi amigo',
  },
};

function HooksLocalizationSection() {
  const locales = Localization.useLocales();
  const calendars = Localization.useCalendars();
  return (
    <>
      <HeadingText>Locales in Preference Order (hook)</HeadingText>
      <MonoText>{JSON.stringify(locales, null, 2)}</MonoText>
      <HeadingText>Calendars in Preference Order (hook)</HeadingText>
      <MonoText>{JSON.stringify(calendars, null, 2)}</MonoText>
    </>
  );
}

LocalizationScreen.navigationOptions = {
  title: 'Localization',
};

export default function LocalizationScreen() {
  return (
    <ScrollView>
      <View style={styles.container}>
        <HooksLocalizationSection />

        <HeadingText>Locales in Preference Order</HeadingText>
        <MonoText>{JSON.stringify(Localization.getLocales(), null, 2)}</MonoText>

        <HeadingText>Calendars in Preference Order</HeadingText>
        <MonoText>{JSON.stringify(Localization.getCalendars(), null, 2)}</MonoText>

        <HeadingText>Localization Table</HeadingText>
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  languageBox: {
    padding: 10,
    borderWidth: 1,
  },
  picker: {
    borderWidth: 1,
    padding: 0,
    margin: 0,
  },
  container: {
    padding: 10,
  },
});
