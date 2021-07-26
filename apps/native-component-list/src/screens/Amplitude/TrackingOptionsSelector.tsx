import { AmplitudeTrackingOptions, setTrackingOptionsAsync } from 'expo-analytics-amplitude';
import React from 'react';
import { PixelRatio, Switch, Text, View, Button, StyleSheet } from 'react-native';

interface State {
  optionsToSet: AmplitudeTrackingOptions;
  options: AmplitudeTrackingOptions;
  showList: boolean;
  result?: string;
  error?: string;
}

export default class TrackingOptionsSelector extends React.Component<object, State> {
  readonly state: State = {
    optionsToSet: {
      disableAdid: true,
      disableCarrier: true,
      disableCity: true,
      disableCountry: true,
      disableDMA: true,
      disableDeviceBrand: true,
      disableDeviceManufacturer: true,
      disableDeviceModel: true,
      disableIDFV: true,
      disableIPAddress: true,
      disableLanguage: true,
      disableLatLng: true,
      disableOSName: true,
      disableOSVersion: true,
      disablePlatform: true,
      disableRegion: true,
      disableVersionName: true,
    },
    options: {
      disableAdid: true,
      disableCarrier: true,
      disableCity: true,
      disableCountry: true,
      disableDMA: true,
      disableDeviceBrand: true,
      disableDeviceManufacturer: true,
      disableDeviceModel: true,
      disableIDFV: true,
      disableIPAddress: true,
      disableLanguage: true,
      disableLatLng: true,
      disableOSName: true,
      disableOSVersion: true,
      disablePlatform: true,
      disableRegion: true,
      disableVersionName: true,
    },
    showList: false,
    result: undefined,
    error: undefined,
  };

  _applyOptions = () => {
    this.setState(state => ({ options: state.optionsToSet }));
  };

  _renderToggle = ({
    title,
    disabled,
    valueName,
    value,
  }: {
    title: string;
    disabled?: boolean;
    valueName:
      | 'disableAdid'
      | 'disableCarrier'
      | 'disableCity'
      | 'disableCountry'
      | 'disableDMA'
      | 'disableDeviceBrand'
      | 'disableDeviceManufacturer'
      | 'disableDeviceModel'
      | 'disableIDFV'
      | 'disableIPAddress'
      | 'disableLanguage'
      | 'disableLatLng'
      | 'disableOSName'
      | 'disableOSVersion'
      | 'disablePlatform'
      | 'disableRegion'
      | 'disableVersionName';
    value?: boolean;
  }) => (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 5,
        borderBottomWidth: 1.0 / PixelRatio.get(),
        borderBottomColor: '#cccccc',
      }}>
      <Text style={{ flex: 1, fontSize: 16 }}>{title}</Text>
      <Switch
        disabled={disabled}
        value={value !== undefined ? value : Boolean(this.state.optionsToSet[valueName])}
        onValueChange={() =>
          this.setState(state => ({
            optionsToSet: { ...state.optionsToSet, [valueName]: !state.optionsToSet[valueName] },
          }))
        }
      />
    </View>
  );

  _toggleListVisibility = () => {
    this.setState(state => {
      return { showList: !state.showList };
    });

    if (this.state.showList) {
      this._applyOptions();
      this._setTrackingOptionsAsync();
    }
  };

  _setTrackingOptionsAsync = async () => {
    await setTrackingOptionsAsync(this.state.options).then(
      () => {
        this.setState({ result: 'Request for tracking options change has been sent' });
        setTimeout(() => {
          this.setState({ result: undefined });
        }, 5000);
      },
      () => {
        this.setState({ error: 'Failed to send request for tracking options change' });
        setTimeout(() => {
          this.setState({ error: undefined });
        }, 5000);
      }
    );
  };

  render() {
    return (
      <View style={{ marginTop: 20 }}>
        <Button title="Toggle tracking options list" onPress={this._toggleListVisibility} />
        {this.state.showList &&
          this._renderToggle({
            title: 'Disable Adid',
            valueName: 'disableAdid',
          })}
        {this.state.showList &&
          this._renderToggle({
            title: 'Disable Carrier',
            valueName: 'disableCarrier',
          })}
        {this.state.showList &&
          this._renderToggle({
            title: 'Disable City',
            valueName: 'disableCity',
          })}
        {this.state.showList &&
          this._renderToggle({
            title: 'Disable Country',
            valueName: 'disableCountry',
          })}
        {this.state.showList &&
          this._renderToggle({
            title: 'Disable DMA',
            valueName: 'disableDMA',
          })}
        {this.state.showList &&
          this._renderToggle({
            title: 'Disable Device brand',
            valueName: 'disableDeviceBrand',
          })}
        {this.state.showList &&
          this._renderToggle({
            title: 'Disable Device manufacturer',
            valueName: 'disableDeviceManufacturer',
          })}
        {this.state.showList &&
          this._renderToggle({
            title: 'Disable Device model',
            valueName: 'disableDeviceModel',
          })}
        {this.state.showList &&
          this._renderToggle({
            title: 'Disable IDFV',
            valueName: 'disableIDFV',
          })}
        {this.state.showList &&
          this._renderToggle({
            title: 'Disable IP Address',
            valueName: 'disableIPAddress',
          })}
        {this.state.showList &&
          this._renderToggle({
            title: 'Disable Language',
            valueName: 'disableLanguage',
          })}
        {this.state.showList &&
          this._renderToggle({
            title: 'Disable Geo?',
            valueName: 'disableLatLng',
          })}
        {this.state.showList &&
          this._renderToggle({
            title: 'Disable OS Name',
            valueName: 'disableOSName',
          })}
        {this.state.showList &&
          this._renderToggle({
            title: 'Disable OS version',
            valueName: 'disableOSVersion',
          })}
        {this.state.showList &&
          this._renderToggle({
            title: 'Disable Platform',
            valueName: 'disablePlatform',
          })}
        {this.state.showList &&
          this._renderToggle({
            title: 'Disable Region',
            valueName: 'disableRegion',
          })}
        {this.state.showList &&
          this._renderToggle({
            title: 'Disable version name',
            valueName: 'disableVersionName',
          })}
        {this.state.error && (
          <View style={[styles.textView, styles.errorView]}>
            <Text style={styles.errorText}>{this.state.error}</Text>
          </View>
        )}
        {this.state.result && (
          <View style={[styles.textView, styles.resultView]}>
            <Text>{this.state.result}</Text>
          </View>
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  textView: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 20,
    marginBottom: 20,
  },
  errorText: {
    color: 'white',
  },
  errorView: {
    backgroundColor: 'red',
  },
  resultView: {
    borderColor: 'green',
    borderWidth: 1,
  },
});
