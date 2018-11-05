import React from 'react';
import { MediaLibrary } from 'expo';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import MonoText from '../../components/MonoText';

export default class MediaAlbumsScreen extends React.Component {
  static navigationOptions = {
    title: 'MediaLibrary Albums',
  };

  state = {
    albums: [],
  };

  async componentWillMount() {
    const albums = await MediaLibrary.getAlbumsAsync();
    this.setState({ albums });
  }

  keyExtractor = item => item.id;

  openAlbum = album => {
    this.props.navigation.navigate('MediaLibrary', { album });
  };

  renderItem = ({ item }) => {
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

  render() {
    const { albums } = this.state;

    if (albums.length === 0) {
      return (
        <View style={styles.noAlbums}>
          <Text>
            {"You don't have any media albums! You can create one from asset details screen."}
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
}

const styles = StyleSheet.create({
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
