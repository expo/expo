import React from 'react';
import { ScrollView, Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

import Colors from '../constants/Colors';
import HeadingText from '../components/HeadingText';
import MonoText from '../components/MonoText';

export default class NetInfoScreen extends React.Component {
  static navigationOptions = {
    title: 'NetInfo',
  };

  state = {
    connectionInfo: null,
    isConnectionExpensive: null,
    isConnectedChangeEvents: [],
    connectionChangeEvents: [],
  };

  componentDidMount() {
    this._eventCounter = 0;

    NetInfo.getConnectionInfo()
      .then(connectionInfo => this.setState({ connectionInfo }))
      .catch(console.warn);
    this._ensureIsConnectionExpensiveIsUpToDate();
    this._subscription = NetInfo.addEventListener('connectionChange', this._handleConnectionChange);
    this._isConnectedSubscription = NetInfo.isConnected.addEventListener(
      'connectionChange',
      this._handleIsConnectedChange
    );
  }

  componentWillUnmount() {
    if (this._subscription) {
      this._subscription.remove();
    }

    if (this._isConnectedSubscription) {
      this._isConnectedSubscription.remove();
    }
  }

  _handleConnectionChange = connectionInfo => {
    this._ensureIsConnectionExpensiveIsUpToDate();
    this.setState(({ connectionChangeEvents }) => ({
      connectionInfo,
      connectionChangeEvents: [
        { connectionInfo, time: new Date(), key: this._eventCounter++ },
        ...connectionChangeEvents,
      ],
    }));
  };

  _ensureIsConnectionExpensiveIsUpToDate = () =>
    Platform.OS === 'android' &&
    NetInfo.isConnectionExpensive()
      .then(isConnectionExpensive => this.setState({ isConnectionExpensive }))
      .catch(console.warn);

  _handleIsConnectedChange = isConnected =>
    this.setState(({ isConnectedChangeEvents }) => ({
      isConnectedChangeEvents: [
        { isConnected, time: new Date(), key: this._eventCounter++ },
        ...isConnectedChangeEvents,
      ],
    }));

  _maybeRenderIsConnectionExpensive = () =>
    Platform.OS === 'android' ? (
      <>
        <HeadingText>NetInfo.isConnectionExpensive()</HeadingText>
        <MonoText>{JSON.stringify(this.state.isConnectionExpensive, null, 2)}</MonoText>
      </>
    ) : null;

  _renderEvents = events =>
    events.map(event => <MonoText key={event.key}>{JSON.stringify(event, null, 2)}</MonoText>);

  render() {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: Colors.greyBackground }}
        contentContainerStyle={{ padding: 10 }}>
        <HeadingText>NetInfo.getConnectionInfo()</HeadingText>
        <MonoText>{JSON.stringify(this.state.connectionInfo, null, 2)}</MonoText>
        {this._maybeRenderIsConnectionExpensive()}
        <HeadingText>NetInfo.addEventListener</HeadingText>
        {this._renderEvents(this.state.connectionChangeEvents)}
        <HeadingText>NetInfo.isConnected.addEventListener</HeadingText>
        {this._renderEvents(this.state.isConnectedChangeEvents)}
      </ScrollView>
    );
  }
}
