import { Picker } from '@react-native-picker/picker';
import * as Localization from 'expo-localization';
import i18n from 'i18n-js';
import { useReducer } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import DeprecatedHeading from '../components/DeprecatedHeading';
import HeadingText from '../components/HeadingText';
import ListButton from '../components/ListButton';
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

interface State {
  isoCurrencyCodes: any;
  currentLocale: any;
  preferredLocales: any;
  locale?: string;
}

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

function lodashChunk(array: any[], size: number) {
  const chunked = [];
  for (let i = 0; i < array.length; i += size) {
    chunked.push(array.slice(i, i + size));
  }
  return chunked;
}

LocalizationScreen.navigationOptions = {
  title: 'Localization',
};

export default function LocalizationScreen() {
  const [state, setState] = useReducer((s: State, a: Partial<State>) => ({ ...s, ...a }), {
    currentLocale: Localization.locale,
    preferredLocales: Localization.locales,
    isoCurrencyCodes: Localization.isoCurrencyCodes,
  });

  const queryPreferredLocales = async () => {
    const preferredLocales = Localization.locales;
    const currentLocale = Localization.locale;
    setState({ preferredLocales, currentLocale });
  };

  const queryCurrencyCodes = async () => {
    if (state.isoCurrencyCodes.length === 0) {
      const isoCurrencyCodes = Localization.isoCurrencyCodes;
      setState({ isoCurrencyCodes });
    }
  };

  const prettyFormatCurrency = () => {
    let buffer = '';
    let seenCount = 0;
    const sample = state.isoCurrencyCodes.slice(0, 100);
    const grouped = lodashChunk(sample, 10);
    let drillDownIndex = 0;
    let currentColumn = 0;
    while (true) {
      while (true) {
        if (seenCount === sample.length) return buffer;
        if (currentColumn === grouped.length) {
          currentColumn = 0;
          buffer += '\n';
          drillDownIndex++;
          continue;
        }
        buffer += `${grouped[currentColumn][drillDownIndex]}\t`;
        seenCount++;
        currentColumn++;
      }
    }
  };

  const changeLocale = (locale: string) => {
    i18n.locale = locale;
    setState({ locale });
  };

  return (
    <ScrollView>
      <View style={styles.container}>
        <HooksLocalizationSection />

        <HeadingText>Locales in Preference Order</HeadingText>
        <MonoText>{JSON.stringify(Localization.getLocales(), null, 2)}</MonoText>

        <HeadingText>Calendars in Preference Order</HeadingText>
        <MonoText>{JSON.stringify(Localization.getCalendars(), null, 2)}</MonoText>

        <HeadingText>Localization Table</HeadingText>
        <Picker
          style={styles.picker}
          selectedValue={state.locale}
          onValueChange={(value) => changeLocale(`${value}`)}>
          <Picker.Item label="🇺🇸 English" value="en" />
          <Picker.Item label="🇪🇸 Spanish" value="es" />
        </Picker>

        <View style={styles.languageBox}>
          <View style={styles.row}>
            <Text>Exists in Both: </Text>
            <Text>{state.currentLocale ? i18n.t('phrase') : ''}</Text>
          </View>
          <View style={styles.row}>
            <Text>Default Case Only: </Text>
            <Text>{state.currentLocale ? i18n.t('default') : ''}</Text>
          </View>
        </View>

        <DeprecatedHeading>Current Locale</DeprecatedHeading>
        <MonoText>{JSON.stringify(state.currentLocale, null, 2)}</MonoText>
        <DeprecatedHeading>Locales in Preference Order</DeprecatedHeading>
        <ListButton title="Show preferred Locales" onPress={queryPreferredLocales} />
        {state.preferredLocales && state.preferredLocales.length > 0 && (
          <MonoText>{JSON.stringify(state.preferredLocales, null, 2)}</MonoText>
        )}

        <DeprecatedHeading>Currency Codes</DeprecatedHeading>
        <ListButton title="Show first 100 currency codes" onPress={queryCurrencyCodes} />
        {state.isoCurrencyCodes && state.isoCurrencyCodes.length > 0 && (
          <MonoText>{prettyFormatCurrency()}</MonoText>
        )}
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
