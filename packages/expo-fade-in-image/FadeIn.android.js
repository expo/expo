import React from 'react';
import { StyleSheet, View } from 'react-native';

const onlyChild = React.Children.only;

export default class FadeIn extends React.Component {

  render() {
    let image = onlyChild(this.props.children);

    // Get rid of any unused styles to avoid warnings
    let safeImageStyle = {...StyleSheet.flatten(image.props.style)};
    delete safeImageStyle.tintColor;
    delete safeImageStyle.resizeMode;

    return (
      <View {...this.props}>
        <View style={styles.placeholderContainer}>
          <View style={[safeImageStyle, styles.placeholder, this.props.placeholderStyle]}>
            {this.props.renderPlaceholderContent}
          </View>
        </View>

        {image}
      </View>
    );
  }
}

let styles = StyleSheet.create({
  placeholderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  placeholder: {
    // default no placeholder style
  },
});
