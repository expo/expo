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

interface Toggle {
  title: string;
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
  };
  private toggles: Toggle[] = [
    { title: 'Disable Adid', valueName: 'disableAdid' },
    { title: 'Disable Carrier', valueName: 'disableCarrier' },
    { title: 'Disable City', valueName: 'disableCity' },
    { title: 'Disable Country', valueName: 'disableCountry' },
    { title: 'Disable DMA', valueName: 'disableDMA' },
    { title: 'Disable device brand', valueName: 'disableDeviceBrand' },
    { title: 'Disable device manufacturer', valueName: 'disableDeviceManufacturer' },
    { title: 'Disable device model', valueName: 'disableDeviceModel' },
    { title: 'Disable IDFV', valueName: 'disableIDFV' },
    { title: 'Disable IP Address', valueName: 'disableIPAddress' },
    { title: 'Disable language', valueName: 'disableLanguage' },
    { title: 'Disable Geo', valueName: 'disableLatLng' },
    { title: 'Disable OS name', valueName: 'disableOSName' },
    { title: 'Disable OS version', valueName: 'disableOSVersion' },
    { title: 'Disable platform', valueName: 'disablePlatform' },
    { title: 'Disable region', valueName: 'disableRegion' },
    { title: 'Disable version name', valueName: 'disableVersionName' },
  ];

  _applyOptions = () => {
    this.setState((state) => ({ options: state.optionsToSet }));
  };

  _renderToggle = ({ title, valueName }: Toggle) => (
    <View style={styles.toggleContainer}>
      <Text style={styles.toggleLabel}>{title}</Text>
      <Switch
        value={Boolean(this.state.optionsToSet[valueName])}
        onValueChange={() =>
          this.setState((state) => ({
            optionsToSet: { ...state.optionsToSet, [valueName]: !state.optionsToSet[valueName] },
          }))
        }
      />
    </View>
  );

  _toggleListVisibility = () => {
    this.setState((state) => ({ showList: !state.showList }));
    if (this.state.showList) {
      this._applyOptions();
      this._setTrackingOptionsAsync();
    }
  };

  _setTrackingOptionsAsync = async () => {
    try {
      await setTrackingOptionsAsync(this.state.options);
      this.setState({ result: 'Request for tracking options change has been sent' });
      setTimeout(() => this.setState({ result: undefined }), 5000);
    } catch {
      this.setState({ error: 'Failed to send request for tracking options change' });
      setTimeout(() => this.setState({ error: undefined }), 5000);
    }
  };

  render() {
    return (
      <View style={styles.container}>
        <Button title="Toggle tracking options list" onPress={this._toggleListVisibility} />
        {this.state.showList && <>{this.toggles.map(this._renderToggle)}</>}
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
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: 1.0 / PixelRatio.get(),
    borderBottomColor: '#cccccc',
  },
  toggleLabel: {
    flex: 1,
    fontSize: 16,
  },
  container: {
    marginTop: 20,
  },
});
