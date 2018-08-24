import React from 'react';
import { StyleSheet, Text, View, Picker, ScrollView, Platform } from 'react-native';
import { DangerZone } from 'expo';
import chunk from 'lodash/chunk';

import HeadingText from '../components/HeadingText';
import MonoText from '../components/MonoText';
import ListButton from '../components/ListButton';

const { Localization } = DangerZone;

const russianMesssage = { phrase: 'Привет мой друг' };

const localization = {
  en_US: {
    phrase: 'Hello my friend',
    default: 'English language only',
  },
  ...Platform.select({
    ios: { ru_US: russianMesssage },
    android: { ru_RU: russianMesssage },
  }),
};

export default class LocalizationScreen extends React.Component {
  static navigationOptions = {
    title: 'Localization',
  };
  constructor(p) {
    super(p);
    this.state = { currentLocale: null, preferredLocales: [], isoCurrencyCodes: [] };
    this.localeStore = new Localization.LocaleStore(localization);
  }
  async componentDidMount() {
    const currentLocale = await Localization.getCurrentLocaleAsync();
    this.setState(() => ({ currentLocale }));
  }
  queryPreferredLocales = async () => {
    const preferredLocales = await Localization.getPreferredLocalesAsync();
    const currentLocale = await Localization.getCurrentLocaleAsync();
    this.setState(() => ({ preferredLocales, currentLocale }));
  };
  queryCurrencyCodes = async () => {
    if (this.state.isoCurrencyCodes.length === 0) {
      const isoCurrencyCodes = await Localization.getISOCurrencyCodesAsync();
      this.setState(() => ({ isoCurrencyCodes }));
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

  changeLocale = locale =>
    this.localeStore.setLocale(locale, () => this.setState(() => ({ locale })));

  render() {
    const preferredLocales = (this.state.preferredLocales && this.state.preferredLocales.length)
          ? (<MonoText>{JSON.stringify(this.state.preferredLocales, null, 2)}</MonoText>)
          : null;
    const currencyCodes = (this.state.isoCurrencyCodes && this.state.isoCurrencyCodes.length)
          ? (<MonoText>{this.prettyFormatCurrency()}</MonoText>)
          : null;
    return (
      <ScrollView>
        <View style={styles.container}>
          <HeadingText>Current Locale</HeadingText>
          <MonoText>{JSON.stringify(this.state.currentLocale, null, 2)}</MonoText>
          
          <HeadingText>Locales in Preference Order</HeadingText>
          <ListButton title={'Show preferred Locales'} onPress={this.queryPreferredLocales} />
          {preferredLocales}

          <HeadingText>Currency Codes</HeadingText>
          <ListButton title={'Show first 100 currency codes'} onPress={this.queryCurrencyCodes} />
          {currencyCodes}

          <HeadingText>Localization Table</HeadingText>
          <Picker
            style={styles.picker}
            selectedValue={this.state.locale}
            onValueChange={this.changeLocale}>
            <Picker.Item label={'🇺🇸 English'} value={'en_US'} />
            <Picker.Item
              label={'🇷🇺 Russian'}
              value={(Platform.OS === 'ios' && 'ru_US') || (Platform.OS === 'android' && 'ru_RU')}
            />
          </Picker>
          
          <MonoText>{JSON.stringify(localization, null, 2)}</MonoText>
          
          <View style={styles.languageBox}>
            <View style={styles.row}>
              <Text>Exists in Both: </Text>
              <Text>{this.state.currentLocale ? this.localeStore.phrase : ''}</Text>
            </View>
            <View style={styles.row}>
              <Text>Default Case Only: </Text>
              <Text>{this.state.currentLocale ? this.localeStore.default : ''}</Text>
            </View>
          </View>
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
