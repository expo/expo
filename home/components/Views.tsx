import * as React from 'react';
import { useTheme } from 'react-navigation';
import { StyleSheet, View, ScrollView } from 'react-native';
import Colors from '../constants/Colors';

type ViewProps = View['props'];
interface Props extends ViewProps {
  lightBackgroundColor?: string;
  darkBackgroundColor?: string;
  lightBorderColor?: string;
  darkBorderColor?: string;
}

type ScrollViewProps = ScrollView['props'];
interface StyledScrollViewProps extends ScrollViewProps {
  lightBackgroundColor?: string;
  darkBackgroundColor?: string;
}

type ThemedColors = keyof typeof Colors.light & keyof typeof Colors.dark;

function useThemeBackgroundColor(props: Props | StyledScrollViewProps, colorName: ThemedColors) {
  let theme = useTheme();
  let colorFromProps = props[`${theme}BackgroundColor`];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[theme][colorName];
  }
}

function useThemeBorderColor(props: Props, colorName: ThemedColors) {
  let theme = useTheme();
  let colorFromProps = props[`${theme}BorderColor`];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[theme][colorName];
  }
}

export const StyledScrollView = (props: StyledScrollViewProps) => {
  let { style, ...otherProps } = props;
  let backgroundColor = useThemeBackgroundColor(props, 'absolute');

  return <ScrollView {...otherProps} style={[{ backgroundColor }, style]} />;
};

export const Separator = (props: View['props']) => {
  let theme = useTheme();
  let { style, ...otherProps } = props;

  return (
    <View
      style={[styles.separator, { backgroundColor: Colors[theme].separator }, style]}
      {...otherProps}
    />
  );
};

export const SectionLabelContainer = (props: View['props']) => {
  let theme = useTheme();
  let { style, ...otherProps } = props;

  return (
    <View
      style={[
        styles.sectionLabelContainer,
        { backgroundColor: Colors[theme].sectionLabelBackgroundColor },
        style,
      ]}
      {...otherProps}
    />
  );
};

export const GenericCardContainer = (props: View['props']) => {
  let theme = useTheme();
  let { style, ...otherProps } = props;

  return (
    <View
      style={[
        styles.genericCardContainer,
        {
          backgroundColor: Colors[theme].cardBackground,
          borderBottomColor: Colors[theme].cardSeparator,
        },
        style,
      ]}
      {...otherProps}
    />
  );
};

export const GenericCardBody = (props: View['props']) => {
  let { style, ...otherProps } = props;

  return <View style={[styles.genericCardBody, style]} {...otherProps} />;
};

export const StyledView = (props: Props) => {
  let {
    style,
    lightBackgroundColor: _lightBackgroundColor,
    darkBackgroundColor: _darkBackgroundColor,
    lightBorderColor: _lightBorderColor,
    darkBorderColor: _darkBorderColor,
    ...otherProps
  } = props;

  let backgroundColor = useThemeBackgroundColor(props, 'cardBackground');
  let borderColor = useThemeBorderColor(props, 'cardSeparator');

  return (
    <View
      style={[
        {
          backgroundColor,
          borderColor,
        },
        style,
      ]}
      {...otherProps}
    />
  );
};

const styles = StyleSheet.create({
  separator: {
    height: StyleSheet.hairlineWidth * 2,
    flex: 1,
  },
  sectionLabelContainer: {
    flexDirection: 'row',
    paddingVertical: 10,
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  genericCardContainer: {
    flexGrow: 1,
    borderBottomWidth: StyleSheet.hairlineWidth * 2,
  },
  genericCardBody: {
    paddingTop: 20,
    paddingLeft: 15,
    paddingRight: 10,
    paddingBottom: 17,
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
//   sectionLabelText: {
//     color: Colors.light.greyText,
//     letterSpacing: 0.92,
//     ...Platform.select({
//       ios: {
//         fontWeight: '500',
//         fontSize: 11,
//       },
//       android: {
//         fontWeight: '400',
//         fontSize: 12,
//       },
//     }),
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
