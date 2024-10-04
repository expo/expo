import { Picker } from '@react-native-picker/picker';
import * as Localization from 'expo-localization';
import i18n from 'i18n-js';
import chunk from 'lodash/chunk';
import React from 'react';
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

// See: https://github.com/expo/expo/pull/10229#discussion_r490961694
// eslint-disable-next-line @typescript-eslint/ban-types
export default class LocalizationScreen extends React.Component<{}, State> {
  static navigationOptions = {
    title: 'Localization',
  };

  readonly state: State = {
    currentLocale: Localization.locale,
    preferredLocales: Localization.locales,
    isoCurrencyCodes: Localization.isoCurrencyCodes,
  };

  queryPreferredLocales = async () => {
    const preferredLocales = Localization.locales;
    const currentLocale = Localization.locale;
    this.setState({ preferredLocales, currentLocale });
  };

  queryCurrencyCodes = async () => {
    if (this.state.isoCurrencyCodes.length === 0) {
      const isoCurrencyCodes = Localization.isoCurrencyCodes;
      this.setState({ isoCurrencyCodes });
    }
  };

  prettyFormatCurrency = () => {
    let buffer = '';
    let seenCount = 0;
    const sample = this.state.isoCurrencyCodes.slice(0, 100);
    const grouped = chunk(sample, 10);
    let drilldownIndex = 0;
    let currentColumn = 0;
    while (true) {
      while (true) {
        if (seenCount === sample.length) return buffer;
        if (currentColumn === grouped.length) {
          currentColumn = 0;
          buffer += '\n';
          drilldownIndex++;
          continue;
        }
        buffer += `${grouped[currentColumn][drilldownIndex]}\t`;
        seenCount++;
        currentColumn++;
      }
    }
  };

  changeLocale = (locale: string) => {
    i18n.locale = locale;
    this.setState({ locale });
  };
  render() {
    return (
      <ScrollView>
        <View style={styles.container}>
          <HeadingText>Locales in Preference Order</HeadingText>
          <MonoText>{JSON.stringify(Localization.getLocales(), null, 2)}</MonoText>

          <HeadingText>Calendars in Preference Order</HeadingText>
          <MonoText>{JSON.stringify(Localization.getCalendars(), null, 2)}</MonoText>

          <HeadingText>Localization Table</HeadingText>
          <Picker
            style={styles.picker}
            selectedValue={this.state.locale}
            onValueChange={(value) => this.changeLocale(`${value}`)}>
            <Picker.Item label="🇺🇸 English" value="en" />
            <Picker.Item label="🇪🇸 Spanish" value="es" />
          </Picker>

          <View style={styles.languageBox}>
            <View style={styles.row}>
              <Text>Exists in Both: </Text>
              <Text>{this.state.currentLocale ? i18n.t('phrase') : ''}</Text>
            </View>
            <View style={styles.row}>
              <Text>Default Case Only: </Text>
              <Text>{this.state.currentLocale ? i18n.t('default') : ''}</Text>
            </View>
          </View>

          <DeprecatedHeading>Current Locale</DeprecatedHeading>
          <MonoText>{JSON.stringify(this.state.currentLocale, null, 2)}</MonoText>
          <DeprecatedHeading>Locales in Preference Order</DeprecatedHeading>
          <ListButton title="Show preferred Locales" onPress={this.queryPreferredLocales} />
          {this.state.preferredLocales && this.state.preferredLocales.length > 0 && (
            <MonoText>{JSON.stringify(this.state.preferredLocales, null, 2)}</MonoText>
          )}

          <DeprecatedHeading>Currency Codes</DeprecatedHeading>
          <ListButton title="Show first 100 currency codes" onPress={this.queryCurrencyCodes} />
          {this.state.isoCurrencyCodes && this.state.isoCurrencyCodes.length > 0 && (
            <MonoText>{this.prettyFormatCurrency()}</MonoText>
          )}
        </View>
      </ScrollView>
    );
  }
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
