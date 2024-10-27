import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import {
  Dimensions,
  LayoutAnimation,
  LayoutChangeEvent,
  StyleSheet,
  Text,
  TextInput,
  TextStyle,
  TouchableOpacity,
  View,
} from 'react-native';

const Layout = {
  window: {
    width: Dimensions.get('window').width,
  },
};
const SearchContainerHorizontalMargin = 10;
const SearchContainerWidth = Layout.window.width - SearchContainerHorizontalMargin * 2;

const SearchIcon = () => (
  <View style={styles.searchIconContainer}>
    <Ionicons name="search" size={18} color="#ccc" />
  </View>
);

export default function SearchBar({
  textColor,
  cancelButtonText,
  tintColor,
  placeholderTextColor,
  onChangeQuery,
  onSubmit,
  onCancelPress,
  initialValue = '',
}: {
  initialValue?: string;
  cancelButtonText?: string;
  selectionColor?: string;
  tintColor: string;
  placeholderTextColor?: string;
  underlineColorAndroid?: string;
  textColor?: string;
  onSubmit?: (query: string) => void;
  onChangeQuery?: (query: string) => void;
  onCancelPress?: (goBack: () => void) => void;
}) {
  const navigation = useNavigation();
  const [text, setText] = React.useState(initialValue);
  const [showCancelButton, setShowCancelButton] = React.useState(false);
  const [inputWidth, setInputWidth] = React.useState(SearchContainerWidth);
  const _textInput = React.useRef<TextInput>(null);

  React.useEffect(() => {
    requestAnimationFrame(() => {
      _textInput.current?.focus();
    });
  }, []);

  const _handleLayoutCancelButton = (e: LayoutChangeEvent) => {
    if (showCancelButton) {
      return;
    }

    const cancelButtonWidth = e.nativeEvent.layout.width;

    requestAnimationFrame(() => {
      LayoutAnimation.configureNext({
        duration: 200,
        create: {
          type: LayoutAnimation.Types.linear,
          property: LayoutAnimation.Properties.opacity,
        },
        update: {
          type: LayoutAnimation.Types.spring,
          springDamping: 0.9,
          initialVelocity: 10,
        },
      });
      setShowCancelButton(true);
      setInputWidth(SearchContainerWidth - cancelButtonWidth);
    });
  };

  const _handleChangeText = (text: string) => {
    setText(text);
    onChangeQuery?.(text);
  };

  const _handleSubmit = () => {
    onSubmit?.(text);
    _textInput.current?.blur?.();
  };

  const _handlePressCancelButton = () => {
    if (onCancelPress) {
      onCancelPress(navigation.goBack);
    } else {
      navigation.goBack();
    }
  };

  const searchInputStyle: TextStyle = {};
  if (textColor) {
    searchInputStyle.color = textColor;
  }

  return (
    <View style={styles.container}>
      <View style={[styles.searchContainer, { width: inputWidth }]}>
        <TextInput
          ref={_textInput}
          clearButtonMode="while-editing"
          onChangeText={_handleChangeText}
          value={text}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          placeholder="Search"
          placeholderTextColor={placeholderTextColor || '#ccc'}
          onSubmitEditing={_handleSubmit}
          style={[styles.searchInput, searchInputStyle]}
        />

        <SearchIcon />
      </View>

      <View
        key={showCancelButton ? 'visible-cancel-button' : 'layout-only-cancel-button'}
        style={[styles.buttonContainer, { opacity: showCancelButton ? 1 : 0 }]}>
        <TouchableOpacity
          style={styles.button}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 20 }}
          onLayout={_handleLayoutCancelButton}
          onPress={_handlePressCancelButton}>
          <Text
            style={{
              fontSize: 17,
              color: tintColor,
            }}>
            {cancelButtonText || 'Cancel'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  buttonContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    paddingTop: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    paddingRight: 17,
    paddingLeft: 2,
  },
  searchContainer: {
    height: 30,
    width: SearchContainerWidth,
    backgroundColor: '#f2f2f2',
    borderRadius: 5,
    marginHorizontal: SearchContainerHorizontalMargin,
    marginTop: 10,
    paddingLeft: 27,
  },
  searchIconContainer: {
    position: 'absolute',
    left: 7,
    top: 6,
    bottom: 0,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingTop: 1,
  },
});
