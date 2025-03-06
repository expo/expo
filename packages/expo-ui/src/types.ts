export type * from '../components/Switch';
export type * from '../components/Picker';
export type * from '../components/Button';
export type * from '../components/ContextMenu';
export type * from '../components/Section';
export type * from '../components/Slider';

/**
 * @hidden
 */
export type ViewEvent<Name extends string, Data> = Record<
  Name,
  Data extends object
    ? ((event: { nativeEvent: Data }) => void) | undefined
    : (() => void) | undefined
>;
