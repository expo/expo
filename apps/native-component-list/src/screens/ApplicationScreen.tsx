import React from 'react';
import { ScrollView, View, Text, Button, Platform } from 'react-native';
import * as Application from 'expo-application';
import HeadingText from '../components/HeadingText';
import MonoText from '../components/MonoText';

interface ApplicationConstant {
  name?: string;
  value?: any;
}

interface ApplicationMethod {
  name?: string;
  method?: any;
}

interface State {
  value?: string;
}

class ApplicationConstants extends React.Component<ApplicationConstant> {
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

class ApplicationMethods extends React.Component<ApplicationMethod, State> {
  state = {
    value: '',
  };

  _getValue = async () => {
    let method = this.props.method;
    let value = await method();
    if (value instanceof Date) {
      value = value.toString();
    }
    this.setState({ value });
  };

  render() {
    let { name } = this.props;
    if (!name) name = '';
    return (
      <View style={{ padding: 10 }}>
        <View style={{ marginBottom: 10 }}>
          <HeadingText>{name}</HeadingText>
          <MonoText> {this.state.value}</MonoText>
        </View>
        <Button onPress={this._getValue} title={name} color="#DCA42D" />
      </View>
    );
  }
}

export default class ApplicationScreen extends React.Component {
  static navigationOptions = {
    title: 'Application',
  };
  render() {
    return (
      <ScrollView style={{ padding: 20, flex: 1, margin: 10 }}>
        <ApplicationConstants
          name="Application nativeApplicationVersion"
          value={Application.nativeApplicationVersion}
        />
        <ApplicationConstants
          name="Application nativeBuildVersion"
          value={Application.nativeBuildVersion}
        />
        <ApplicationConstants
          name="Application applicationName"
          value={Application.applicationName}
        />
        <ApplicationConstants name="Application applicationId" value={Application.applicationId} />
        <ApplicationConstants name="Application androidId" value={Application.androidId} />
        <ApplicationMethods
          name="Application get install referrer"
          method={Application.getInstallReferrerAsync}
        />
        <ApplicationMethods
          name="Application get IosIdForVendor"
          method={Application.getIosIdForVendorAsync}
        />
        <ApplicationMethods
          name="Application get first install time"
          method={Application.getFirstInstallTimeAsync}
        />
        <ApplicationMethods
          name="Application get last update time"
          method={Application.getLastUpdateTimeAsync}
        />
      </ScrollView>
    );
  }
}
