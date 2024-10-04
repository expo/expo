import FontAwesome from '@expo/vector-icons/FontAwesome';
import { TabTriggerSlotProps } from 'expo-router/ui';
import { ComponentProps, Ref, forwardRef } from 'react';
import { Text, StyleSheet, Pressable, View } from 'react-native';

type Icon = ComponentProps<typeof FontAwesome>['name'];

export type TabButtonProps = TabTriggerSlotProps & {
  icon?: Icon;
};

export const TabButton = forwardRef(
  ({ icon, children, isFocused, ...props }: TabButtonProps, ref: Ref<View>) => {
    return (
      <Pressable
        ref={ref}
        {...props}
        style={[styles.button, isFocused ? styles.focusedBackground : undefined]}>
        <FontAwesome name={icon} />
        <Text style={[styles.tabTriggerText, isFocused ? styles.focusedText : undefined]}>
          {children}
        </Text>
      </Pressable>
    );
  }
);

const styles = StyleSheet.create({
  root: {
    backgroundColor: '#DDDDDD',
    flex: 1,
  },
  button: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'column',
    gap: 5,
    padding: 10,
  },
  tabTriggerText: {
    fontSize: 16,
  },
  focusedBackground: {
    backgroundColor: 'grey',
  },
  focusedText: {
    color: 'white',
  },
});
