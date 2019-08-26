import * as React from 'react';
import { useTheme, Themed } from 'react-navigation';
import { Platform, StyleSheet, Text } from 'react-native';

import Colors from '../constants/Colors';

type TextProps = Text['props'];
interface Props extends TextProps {
  lightColor?: string;
  darkColor?: string;
}

type ThemedColors = keyof typeof Colors.light & keyof typeof Colors.dark;

function useThemeColor(props: Props, colorName: ThemedColors) {
  let theme = useTheme();
  let colorFromProps = props[`${theme}Color`];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[theme][colorName];
  }
}

export const SectionLabelText = (props: Props) => {
  let { style, ...otherProps } = props;
  let color = useThemeColor(props, 'sectionLabelText');

  return <Text style={[styles.sectionLabelText, { color }, style]} {...otherProps} />;
};

export const GenericCardTitle = (props: Props) => {
  let { style, ...otherProps } = props;
  let color = useThemeColor(props, 'cardTitle');

  return <Text style={[styles.genericCardTitle, { color }, style]} {...otherProps} />;
};

export const StyledText = (props: Props) => {
  let { style, ...otherProps } = props;
  let color = useThemeColor(props, 'text');

  return <Text style={[{ color }, style]} {...otherProps} />;
};

const styles = StyleSheet.create({
  sectionLabelText: {
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
  genericCardTitle: {
    color: Colors.light.blackText,
    fontSize: 16,
    marginRight: 50,
    marginBottom: 2,
    fontWeight: '400',
  },
});

// const light = StyleSheet.create({
//   sectionLabelContainer: {
//     flexDirection: 'row',
//     paddingVertical: 10,
//     alignItems: 'center',
//     paddingHorizontal: 15,
//     backgroundColor: Colors.light.greyBackground,
//   },
//   regularText: {
//     color: Colors.light.blackText,
//     fontSize: 13,
//   },
//   faintText: {
//     color: Colors.light.greyText,
//     fontSize: 13,
//   },
//   noticeTitleText: {
//     color: '#232b3a',
//     marginBottom: 15,
//     fontWeight: '400',
//     ...Platform.select({
//       ios: {
//         fontSize: 22,
//       },
//       android: {
//         fontSize: 23,
//       },
//     }),
//   },
//   noticeDescriptionText: {
//     color: 'rgba(36, 44, 58, 0.7)',
//     textAlign: 'center',
//     marginBottom: 20,
//     ...Platform.select({
//       ios: {
//         fontSize: 15,
//         lineHeight: 20,
//         marginHorizontal: 10,
//       },
//       android: {
//         fontSize: 16,
//         lineHeight: 24,
//         marginHorizontal: 15,
//       },
//     }),
//   },
//   genericCardContainer: {
//     backgroundColor: '#fff',
//     flexGrow: 1,
//     borderBottomColor: Colors.light.separator,
//     borderBottomWidth: StyleSheet.hairlineWidth * 2,
//   },
//   genericCardBody: {
//     paddingTop: 20,
//     paddingLeft: 15,
//     paddingRight: 10,
//     paddingBottom: 17,
//   },
//   genericCardDescriptionContainer: {
//     paddingHorizontal: 15,
//     paddingTop: 10,
//   },
//   genericCardDescriptionText: {
//     color: Colors.light.greyText,
//     fontSize: 13,
//   },
//   genericCardTitle: {
//     color: Colors.light.blackText,
//     fontSize: 16,
//     marginRight: 50,
//     marginBottom: 2,
//     fontWeight: '400',
//   },
// });
