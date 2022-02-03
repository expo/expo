import { StackNavigationProp } from '@react-navigation/stack';
import * as MediaLibrary from 'expo-media-library';
import React from 'react';
import {
  FlatList,
  ListRenderItem,
  Platform,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import MonoText from '../../components/MonoText';

interface State {
  includeSmartAlbums: boolean;
  albums: MediaLibrary.Album[];
}

type Props = {
  navigation: StackNavigationProp<{ MediaLibrary: { album: MediaLibrary.Album } }>;
};

export default class MediaAlbumsScreen extends React.Component<Props, State> {
  static navigationOptions = {
    title: 'MediaLibrary Albums',
  };

  state: State = {
    includeSmartAlbums: false,
    albums: [],
  };

  componentDidMount() {
    this.fetchAlbums(this.state.includeSmartAlbums).then((albums) => this.setState({ albums }));
  }

  componentDidUpdate(_: Props, lastState: State) {
    if (lastState.includeSmartAlbums !== this.state.includeSmartAlbums) {
      this.fetchAlbums(this.state.includeSmartAlbums).then((albums) => this.setState({ albums }));
    }
  }

  async fetchAlbums(includeSmartAlbums: boolean) {
    try {
      return await MediaLibrary.getAlbumsAsync({
        includeSmartAlbums,
      });
    } catch (e) {
      if (e.code === 'ERR_NO_ENOUGH_PERMISSIONS') {
        return [];
      } else {
        throw e;
      }
    }
  }

  keyExtractor = (item: MediaLibrary.Album) => item.id;

  openAlbum = (album: MediaLibrary.Album) => {
    this.props.navigation.navigate('MediaLibrary', { album });
  };

  renderItem: ListRenderItem<MediaLibrary.Album> = ({ item }) => {
    return (
      <TouchableOpacity style={styles.album} onPress={() => this.openAlbum(item)}>
        <View style={styles.albumHeader}>
          <Text>{item.title}</Text>
          <Text>{item.assetCount}</Text>
        </View>
        <MonoText>{JSON.stringify(item, null, 2)}</MonoText>
      </TouchableOpacity>
    );
  };

  renderContent() {
    const { albums } = this.state;

    if (albums.length === 0) {
      return (
        <View style={styles.noAlbums}>
          <Text>
            You don't have any media albums! You can create one from asset details screen.
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={albums}
        numColumns={1}
        keyExtractor={this.keyExtractor}
        renderItem={this.renderItem}
      />
    );
  }

  renderSmartAlbumsToggle() {
    return (
      <View style={styles.includeSmartAlbumsRow}>
        <Text style={styles.includeSmartAlbumsTitle}>Include smart albums</Text>
        <Switch
          value={this.state.includeSmartAlbums}
          onValueChange={() =>
            this.setState((state) => ({ includeSmartAlbums: !state.includeSmartAlbums }))
          }
        />
      </View>
    );
  }

  render() {
    return (
      <View style={styles.fill}>
        {Platform.OS === 'ios' && this.renderSmartAlbumsToggle()}
        {this.renderContent()}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  includeSmartAlbumsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#cccccc',
  },
  includeSmartAlbumsTitle: { flex: 1, fontSize: 16 },
  album: {
    flex: 1,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'gray',
  },
  albumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  noAlbums: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
