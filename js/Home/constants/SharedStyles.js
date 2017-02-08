import {
  Platform,
  StyleSheet,
} from 'react-native';

import Colors from './Colors';

export default StyleSheet.create({
  sectionLabelContainer: {
    flexDirection: 'row',
    paddingVertical: 10,
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  sectionLabelText: {
    color: Colors.greyText,
    letterSpacing: 0.92,
    ...Platform.select({
      ios: {
        fontWeight: '500',
        fontSize: 11,
      },
      android: {
        fontWeight: '400',
        fontSize: 12,
      },
    }),
  },
  noticeTitleText: {
    color: '#232b3a',
    marginBottom: 15,
    fontWeight: '400',
    ...Platform.select({
      ios: {
        fontSize: 22,
      },
      android: {
        fontSize: 23,
      },
    }),
  },
  noticeDescriptionText: {
    color: 'rgba(36, 44, 58, 0.7)',
    textAlign: 'center',
    marginBottom: 20,
    ...Platform.select({
      ios: {
        fontSize: 15,
        lineHeight: 20,
        marginHorizontal: 10,
      },
      android: {
        fontSize: 16,
        lineHeight: 24,
        marginHorizontal: 15,
      },
    }),
  },
});
