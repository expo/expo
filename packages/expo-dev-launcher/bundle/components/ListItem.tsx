import React from 'react';
import { StyleSheet, TouchableOpacity, View, Platform, Image } from 'react-native';

import { MainText, SecondaryText } from './Text';
import { MainView } from './Views';

type Props = {
  title?: string;
  subtitle?: string;
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  image?: number | string;
};

class ListItem extends React.PureComponent<Props> {
  private renderTitle() {
    const { title } = this.props;

    return title ? (
      <View style={styles.titleContainer}>
        <MainText style={styles.titleText} ellipsizeMode="tail" numberOfLines={1}>
          {title}
        </MainText>
      </View>
    ) : null;
  }

  private renderSubtitle() {
    const { title, subtitle, image } = this.props;
    const isCentered = !title && !image;

    return subtitle ? (
      <SecondaryText
        style={[styles.subtitleText, isCentered ? styles.subtitleCentered : null]}
        ellipsizeMode="tail"
        numberOfLines={title ? 1 : 2}>
        {subtitle}
      </SecondaryText>
    ) : null;
  }

  private renderImage() {
    const { image } = this.props;

    const source = typeof image === 'number' ? image : { uri: image };
    if (!image) {
      return null;
    }

    return (
      <View style={styles.imageContainer}>
        <Image source={source} style={styles.image} />
      </View>
    );
  }

  render() {
    const { title, subtitle, ...props } = this.props;

    return (
      <TouchableOpacity {...props}>
        <MainView style={styles.container}>
          {this.renderImage()}
          <View style={[styles.textContainer, title && subtitle ? styles.textContainerBoth : null]}>
            {this.renderTitle()}
            {this.renderSubtitle()}
          </View>
        </MainView>
      </TouchableOpacity>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    minHeight: 44,
    paddingStart: 15,
    borderBottomWidth: 1,
  },

  imageContainer: {
    alignSelf: 'center',
    borderRadius: 3,
    marginEnd: 10,
  },
  image: {
    backgroundColor: '#fff',
    borderRadius: 3,
    width: 54,
    height: 54,
  },

  textContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  textContainerBoth: {
    paddingTop: 13,
    paddingBottom: 13,
  },

  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  titleText: {
    flex: 1,
    fontSize: 15,
    ...Platform.select({
      ios: {
        fontWeight: '500',
      },
      android: {
        fontWeight: '400',
        marginTop: 1,
      },
    }),
  },

  subtitleText: {
    fontSize: 13,
  },
  subtitleCentered: {
    textAlign: 'center',
    marginEnd: 10,
  },
});

export default ListItem;
