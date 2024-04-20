import { ActionSheetOptions } from '@expo/react-native-action-sheet';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Text, TextStyle, View } from 'react-native';

const icon = (name: string) => <MaterialCommunityIcons key={name} name={name as any} size={24} />;

// A custom button that shows examples of different share sheet configurations
export default function ShowActionSheetButton({
  title,
  withTitle = false,
  withMessage = false,
  withIcons = false,
  withSeparators = false,
  withCustomStyles = false,
  onSelection = null,
  showActionSheetWithOptions,
}: {
  title: string;
  showActionSheetWithOptions: (
    options: ActionSheetOptions,
    onSelection: (index: number) => void
  ) => void;
  onSelection: ((index: number) => void) | null;
  withTitle?: boolean;
  withMessage?: boolean;
  withIcons?: boolean;
  withSeparators?: boolean;
  withCustomStyles?: boolean;
}) {
  const showActionSheet = () => {
    // Same interface as https://facebook.github.io/react-native/docs/actionsheetios.html
    const options = ['Delete', 'Save', 'Share', 'Cancel'];
    const icons = withIcons
      ? [icon('delete'), icon('content-save'), icon('share'), icon('cancel')]
      : undefined;
    const title = withTitle ? 'Choose An Action' : undefined;
    const message = withMessage
      ? 'This library tries to mimic the native share sheets as close as possible.'
      : undefined;
    const destructiveButtonIndex = 0;
    const cancelButtonIndex = 3;
    const textStyle: TextStyle | undefined = withCustomStyles
      ? { fontSize: 20, fontWeight: '500', color: 'blue' }
      : undefined;
    const titleTextStyle: TextStyle | undefined = withCustomStyles
      ? {
          fontSize: 24,
          textAlign: 'center',
          fontWeight: '700',
          color: 'orange',
        }
      : undefined;
    const messageTextStyle: TextStyle | undefined = withCustomStyles
      ? { fontSize: 12, color: 'purple', textAlign: 'right' }
      : undefined;

    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
        destructiveButtonIndex,
        title,
        message,
        icons, // Android only
        tintIcons: true, // Android only; default is true
        showSeparators: withSeparators, // Affects Android only; default is false
        textStyle, // Android only
        titleTextStyle, // Android only
        messageTextStyle, // Android only
      },
      (buttonIndex) => {
        // Do something here depending on the button index selected
        onSelection?.(buttonIndex);
      }
    );
  };

  return (
    <View style={{ margin: 6 }}>
      <MaterialCommunityIcons.Button
        name="code-tags"
        backgroundColor="#3e3e3e"
        onPress={showActionSheet}>
        <Text
          style={{
            fontSize: 15,
            color: '#fff',
          }}>
          {title}
        </Text>
      </MaterialCommunityIcons.Button>
    </View>
  );
}
