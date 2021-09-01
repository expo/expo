import NetInfo, { NetInfoState, NetInfoSubscription } from '@react-native-community/netinfo';
import React from 'react';
import { ScrollView, View } from 'react-native';

import HeadingText from '../components/HeadingText';
import MonoText from '../components/MonoText';
import Colors from '../constants/Colors';

interface ConnectionEvent {
  time: Date;
  key: number;
  connectionInfo: NetInfoState;
}

interface ConnectionChangeEvent extends ConnectionEvent {
  connectionInfo: NetInfoState;
}

interface State {
  connectionInfo: NetInfoState | null;
  connectionChangeEvents: ConnectionChangeEvent[];
}

// See: https://github.com/expo/expo/pull/10229#discussion_r490961694
// eslint-disable-next-line @typescript-eslint/ban-types
export default class NetInfoScreen extends React.Component<{}, State> {
  static navigationOptions = {
    title: 'NetInfo',
  };

  readonly state: State = {
    connectionInfo: null,
    connectionChangeEvents: [],
  };

  eventCounter: number = 0;
  subscription: NetInfoSubscription = NetInfo.addEventListener((connectionInfo) =>
    this.handleConnectionChange(connectionInfo)
  );

  componentDidMount() {
    this.fetchStateAsync();
  }

  componentWillUnmount() {
    if (this.subscription) {
      // Unsubscribe NetInfo events subscription.
      this.subscription();
    }
  }

  async fetchStateAsync() {
    try {
      const state = await NetInfo.fetch();
      this.setState({ connectionInfo: state });
    } catch (e) {
      console.warn(e);
    }
  }

  handleConnectionChange(connectionInfo: NetInfoState): void {
    this.setState(({ connectionChangeEvents }) => ({
      connectionInfo,
      connectionChangeEvents: [
        { connectionInfo, time: new Date(), key: this.eventCounter++ },
        ...connectionChangeEvents,
      ],
    }));
  }

  _renderEvents = (events: ConnectionEvent[]) => {
    return events.map((event) => (
      <View key={event.key}>
        <HeadingText style={{ fontSize: 14 }}>{String(event.time)}</HeadingText>
        <MonoText key={event.key}>{JSON.stringify(event.connectionInfo, null, 2)}</MonoText>
      </View>
    ));
  };

  render() {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: Colors.greyBackground }}
        contentContainerStyle={{ padding: 10 }}>
        <HeadingText>NetInfo current state:</HeadingText>
        <MonoText>{JSON.stringify(this.state.connectionInfo, null, 2)}</MonoText>

        <HeadingText>NetInfo events:</HeadingText>
        {this._renderEvents(this.state.connectionChangeEvents)}
      </ScrollView>
    );
  }
}
