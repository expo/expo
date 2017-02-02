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
});
