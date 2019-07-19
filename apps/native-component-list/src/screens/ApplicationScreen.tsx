import React from 'react';
import { ScrollView, View, Text, Button, Platform } from 'react-native';
import * as Application from 'expo-application';
import HeadingText from '../components/HeadingText';
import MonoText from '../components/MonoText';

interface ApplicationConstantsName {
  name?: string;
  value?: any;
}

interface mState {
  installReferrer?: string;
  idForVendor?: string;
  firstInstallDate?: string | undefined;
  lastUpdateDate?: string | undefined;
}

interface props {}

class ApplicationConstants extends React.Component<ApplicationConstantsName> {
  render() {
    let { name, value } = this.props;
    if (typeof value === 'boolean') {
      return (
        <View style={{ marginBottom: 10 }}>
          <HeadingText>{name}</HeadingText>
          <MonoText> {String(value)}</MonoText>
        </View>
      );
    } else {
      return (
        <View style={{ marginBottom: 10 }}>
          <HeadingText>{name}</HeadingText>
          <MonoText> {value}</MonoText>
        </View>
      );
    }
  }
}

export default class DeviceScreen extends React.PureComponent<props, mState> {
  static navigationOptions = {
    title: 'Device',
  };

  constructor(props: Readonly<props>) {
    super(props);
    this.state = {
      installReferrer: '',
      idForVendor: '',
      firstInstallDate: '',
      lastUpdateDate: ''
    };
  }

  _getInstallReferrer = () => {
    Application.getInstallReferrerAsync().then(installReferrer => {
      this.setState({ installReferrer: installReferrer });
    });
  };

  _getIDFV = () => {
    Application.getIosIdForVendorAsync().then(idForVendor => {
      this.setState({ idForVendor: idForVendor });
    });
  };

  _getFirstInstallDate = () => {
    Application.getFirstInstallTimeAsync().then(firstInstallDate => {
      this.setState({ firstInstallDate: firstInstallDate.toDateString() });
    });
  };

  _getLastUpdateDate = () => {
    Application.getLastUpdateTimeAsync().then(lastUpdateDate => {
      this.setState({ lastUpdateDate: lastUpdateDate.toDateString() });
    });
  };

  render() {
    return (
      <ScrollView style={{ padding: 20, flex: 1, margin: 10 }}>
        <ApplicationConstants
          name="Application nativeApplicationVersion"
          value={Application.nativeApplicationVersion}></ApplicationConstants>
        <ApplicationConstants
          name="Application nativeBuildVersion"
          value={Application.nativeBuildVersion}></ApplicationConstants>
        <ApplicationConstants
          name="Application applicationName"
          value={Application.applicationName}></ApplicationConstants>
        <ApplicationConstants
          name="Application bundleId"
          value={Application.bundleId}></ApplicationConstants>
        <ApplicationConstants
          name="Application androidId"
          value={Application.androidId}></ApplicationConstants>
        <View style={{ padding: 10 }}>
          <View style={{ marginBottom: 10 }}>
            <HeadingText>get InstallReferrer</HeadingText>
            <MonoText> {this.state.installReferrer}</MonoText>
          </View>
          <Button onPress={this._getInstallReferrer} title="get InstallReferrer" color="#DCA42D" />
        </View>
        <View style={{ padding: 10 }}>
          <View style={{ marginBottom: 10 }}>
            <HeadingText>get IosIdForVendor</HeadingText>
            <MonoText> {this.state.idForVendor}</MonoText>
          </View>
          <Button onPress={this._getIDFV} title="get IosIdForVendor" color="#DCA42D" />
        </View>
        <View style={{ padding: 10 }}>
          <View style={{ marginBottom: 10 }}>
            <HeadingText>get firstInstallDate</HeadingText>
            <MonoText> {this.state.firstInstallDate}</MonoText>
          </View>
          <Button
            onPress={this._getFirstInstallDate}
            title="get firstInstallDate"
            color="#DCA42D"
          />
        </View>
        <View style={{ padding: 10 }}>
          <View style={{ marginBottom: 10 }}>
            <HeadingText>get lastUpdateDate</HeadingText>
            <MonoText> {this.state.lastUpdateDate}</MonoText>
          </View>
          <Button onPress={this._getLastUpdateDate} title="get lastUpdateDate" color="#DCA42D" />
        </View>
      </ScrollView>
    );
  }
}
