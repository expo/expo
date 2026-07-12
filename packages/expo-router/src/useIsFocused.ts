'use client';

/**
 * Returns whether the screen it is called from is currently focused. The value is `true` when the
 * screen is focused and `false` otherwise, and the component re-renders whenever it changes.
 *
 * Use this when you need the focus state as a value during render. To run side effects on focus
 * and blur instead, use `useFocusEffect`, which does not trigger a re-render on focus change.
 *
 * @example
 * ```tsx
 * import { useIsFocused } from 'expo-router';
 *
 * export default function Route() {
 *   const isFocused = useIsFocused();
 *
 *   return <Text>{isFocused ? 'Focused' : 'Not focused'}</Text>;
 * }
 * ```
 */
export { useIsFocused } from './react-navigation/native';
