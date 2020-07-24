import { Platform, StyleSheet } from 'react-native';

import Colors from './Colors';

export default StyleSheet.create({
  sectionLabelContainer: {
    flexDirection: 'row',
    paddingVertical: 10,
    alignItems: 'center',
    paddingHorizontal: 15,
    backgroundColor: Colors.light.greyBackground,
  },
  sectionLabelText: {
    color: Colors.light.greyText,
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
  regularText: {
    color: Colors.light.blackText,
    fontSize: 13,
  },
  faintText: {
    color: Colors.light.greyText,
    fontSize: 13,
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
  genericCardContainer: {
    backgroundColor: '#fff',
    flexGrow: 1,
    borderBottomColor: Colors.light.separator,
    borderBottomWidth: StyleSheet.hairlineWidth * 2,
  },
  genericCardBody: {
    paddingTop: 20,
    paddingLeft: 15,
    paddingRight: 10,
    paddingBottom: 17,
  },
  genericCardDescriptionContainer: {
    paddingHorizontal: 15,
    paddingTop: 10,
  },
  genericCardDescriptionText: {
    color: Colors.light.greyText,
    fontSize: 13,
  },
  genericCardTitle: {
    color: Colors.light.blackText,
    fontSize: 16,
    marginRight: 50,
    marginBottom: 2,
    fontWeight: '400',
  },
});
