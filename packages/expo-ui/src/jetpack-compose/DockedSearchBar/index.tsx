import { requireNativeView } from 'expo';
import { Children } from 'react';

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
  return <>{props.children}</>;
}
DockedSearchBarPlaceholder.tag = 'Placeholder';

export function DockedSearchBarLeadingIcon(props: LeadingIconProps) {
  return <>{props.children}</>;
}
DockedSearchBarLeadingIcon.tag = 'LeadingIcon';

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
  let placeholderContent: React.ReactNode = null;
  let leadingIconContent: React.ReactNode = null;
  const regularChildren: React.ReactNode[] = [];

  Children.forEach(props.children as any, (child) => {
    if (child?.type?.tag === DockedSearchBarPlaceholder.tag) {
      placeholderContent = child.props.children;
    } else if (child?.type?.tag === DockedSearchBarLeadingIcon.tag) {
      leadingIconContent = child.props.children;
    } else {
      regularChildren.push(child);
    }
  });

  return (
    <DockedSearchBarNativeView {...transformDockedSearchBarProps(props)}>
      {regularChildren}
      {placeholderContent && (
        <SlotNativeView slotName="placeholder">{placeholderContent}</SlotNativeView>
      )}
      {leadingIconContent && (
        <SlotNativeView slotName="leadingIcon">{leadingIconContent}</SlotNativeView>
      )}
    </DockedSearchBarNativeView>
  );
}

DockedSearchBar.Placeholder = DockedSearchBarPlaceholder;
DockedSearchBar.LeadingIcon = DockedSearchBarLeadingIcon;

export { DockedSearchBar };
