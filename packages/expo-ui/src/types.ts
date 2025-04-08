export type * from '../Button';
export type * from '../ContextMenu';
export type * from '../Picker';
export type * from '../Section';
export type * from '../Slider';
export type * from '../Switch';
export type * from '../Label';
export type * from '../List';

/**
 * @hidden
 */
export type ViewEvent<Name extends string, Data> = Record<
  Name,
  Data extends object
    ? ((event: { nativeEvent: Data }) => void) | undefined
    : (() => void) | undefined
>;
