/**
 * A hook that manages both controlled and uncontrolled state for components.
 * This is a common pattern in React component libraries.
 *
 * @param controlledValue - The controlled value (undefined means uncontrolled)
 * @param defaultValue - The default value for uncontrolled mode
 * @param onChange - Callback when the value changes
 * @returns [value, setValue] tuple
 */
export declare function useControlledState<T>(controlledValue: T | undefined, defaultValue: T, onChange?: (value: T) => void): [T, (value: T) => void];
//# sourceMappingURL=useControlledState.d.ts.map