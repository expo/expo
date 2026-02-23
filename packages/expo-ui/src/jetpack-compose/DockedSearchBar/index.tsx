import { requireNativeView } from 'expo';

import { type ExpoModifier, type ViewEvent } from '../../types';
import { createViewModifierEventListener } from '../modifiers/utils';

export type DockedSearchBarProps = {
  /**
   * Callback function that is called when the search query changes.
   */
  onQueryChange?: (query: string) => void;

  /**
   * Modifiers for the component.
   */
  modifiers?: ExpoModifier[];

  /**
   * The children of the component.
   */
  children?: React.ReactNode;
};

type PlaceholderProps = {
  children: React.ReactNode;
};

type LeadingIconProps = {
  children: React.ReactNode;
};

type NativeDockedSearchBarProps = Omit<DockedSearchBarProps, 'onQueryChange'> &
  ViewEvent<'onQueryChange', { value: string }>;

type NativeSlotViewProps = {
  slotName: string;
  children: React.ReactNode;
};

const DockedSearchBarNativeView: React.ComponentType<NativeDockedSearchBarProps> =
  requireNativeView('ExpoUI', 'DockedSearchBarView');

const SlotNativeView: React.ComponentType<NativeSlotViewProps> = requireNativeView(
  'ExpoUI',
  'SlotView'
);

export function DockedSearchBarPlaceholder(props: PlaceholderProps) {
  return <SlotNativeView slotName="placeholder">{props.children}</SlotNativeView>;
}

export function DockedSearchBarLeadingIcon(props: LeadingIconProps) {
  return <SlotNativeView slotName="leadingIcon">{props.children}</SlotNativeView>;
}

function transformDockedSearchBarProps(props: DockedSearchBarProps): NativeDockedSearchBarProps {
  const { modifiers, onQueryChange, ...restProps } = props;
  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...restProps,
    onQueryChange: (event) => {
      onQueryChange?.(event.nativeEvent.value);
    },
  };
}

function DockedSearchBar(props: DockedSearchBarProps) {
  return (
    <DockedSearchBarNativeView {...transformDockedSearchBarProps(props)}>
      {props.children}
    </DockedSearchBarNativeView>
  );
}

DockedSearchBar.Placeholder = DockedSearchBarPlaceholder;
DockedSearchBar.LeadingIcon = DockedSearchBarLeadingIcon;

export { DockedSearchBar };
