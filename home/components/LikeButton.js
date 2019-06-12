/* @flow */
import TouchableNativeFeedbackSafe from '@expo/react-native-touchable-native-feedback-safe';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const LikeButton = React.memo(({ liked, style, ...props }) => (
  <View style={style}>
    <TouchableNativeFeedbackSafe
      {...props}
      style={[styles.container, liked && styles.containerLiked]}>
      <Ionicons
        style={[styles.icon, liked && styles.iconLiked]}
        name={liked ? 'heart' : 'heart-empty'}
        size={14}
      />
      <Text style={[styles.text, liked && styles.textLiked]}>{liked ? 'Liked' : 'Like'}</Text>
    </TouchableNativeFeedbackSafe>
  </View>
));

export default LikeButton;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderColor: 'rgba(36, 44, 58, 0.08)',
    borderWidth: 1,
    borderRadius: 4,
    flexDirection: 'row',
    paddingVertical: 5,
    paddingRight: 10,
    paddingLeft: 14,
    alignItems: 'center',
    width: 72,
  },
  containerLiked: {
    paddingLeft: 10,
  },
  icon: {
    marginTop: 2,
    marginRight: 5,
    color: '#4E9BDE',
  },
  iconLiked: {
    color: '#DE4E4E',
  },
  text: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '500',
    color: '#4E9BDE',
  },
  textLiked: {
    color: '#DE4E4E',
  },
});
