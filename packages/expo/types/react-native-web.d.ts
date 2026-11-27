/* eslint-disable */

/// <reference types="react-native-web/types" />

export {};

declare module 'react-native' {
  interface ViewProps {
    className?: string;
  }

  interface TextProps {
    className?: string;
  }

  interface FlatListProps<ItemT> {
    className?: string;
  }

  interface ImagePropsBase {
    className?: string;
  }

  interface SwitchProps {
    className?: string;
  }

  interface InputAccessoryViewProps {
    className?: string;
  }

  interface TouchableWithoutFeedbackProps {
    className?: string;
  }
}
