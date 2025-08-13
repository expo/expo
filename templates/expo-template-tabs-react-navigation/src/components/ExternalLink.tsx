import { openBrowserAsync } from 'expo-web-browser';
import { type ComponentProps } from 'react';
import { Platform, Pressable } from 'react-native';

type Props = ComponentProps<typeof Pressable> & { href: string };

export function ExternalLink({ href, children, ...rest }: Props) {
  return (
    <Pressable
      {...rest}
      onPress={async () => {
        if (Platform.OS === 'web') {
          // On web, open in new tab
          window.open(href, '_blank');
        } else {
          // On native, open in in-app browser
          await openBrowserAsync(href);
        }
      }}>
      {children}
    </Pressable>
  );
}
