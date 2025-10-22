import React, {
  Children,
  isValidElement,
  type ComponentProps,
  type PropsWithChildren,
  type ReactElement,
  type ReactNode,
} from 'react';
import { type TextStyle } from 'react-native';
import {
  ScreenStack,
  ScreenStackItem,
  type HeaderBarButtonItem,
  type HeaderBarButtonItemMenuAction,
  type ScreenStackHeaderConfigProps,
} from 'react-native-screens';

import { LinkMenu, LinkMenuAction } from '../link/elements';
import { Badge, Label } from '../native-tabs/common/elements';

interface StackWithButtonsProps extends PropsWithChildren {}

function StackHeaderComponent(props: PropsWithChildren) {
  return null;
}

function StackHeaderLeft(props: PropsWithChildren) {
  return null;
}

function StackHeaderRight(props: PropsWithChildren) {
  return null;
}

function StackHeaderButton(props: {
  children?: ReactNode;
  onPress?: () => void;
  style?: TextStyle;
}) {
  return null;
}

function StackHeaderTitle(props: {
  children?: string;
  style?: TextStyle;
  largeStyle?: TextStyle;
  large?: boolean;
}) {
  return null;
}

export const StackHeader = Object.assign(StackHeaderComponent, {
  Left: StackHeaderLeft,
  Right: StackHeaderRight,
  Button: StackHeaderButton,
  BackButton: StackHeaderButton,
  Title: StackHeaderTitle,
});

function StackWithButtonsComponent(props: StackWithButtonsProps) {
  const content = React.Children.toArray(props.children).filter(
    (c) => !React.isValidElement(c) || c.type !== StackHeader
  );
  const header = getFirstChildOfType(props.children, StackHeaderComponent);
  const headerLeft = getFirstChildOfType(header?.props.children, StackHeaderLeft);
  const headerRight = getFirstChildOfType(header?.props.children, StackHeaderRight);
  const leftHeaderButtons = getAllChildrenOfType(headerLeft?.props.children, StackHeaderButton);
  const rightHeaderButtons = getAllChildrenOfType(headerRight?.props.children, StackHeaderButton);
  const leftMenus = getAllChildrenOfType(headerLeft?.props.children, LinkMenu);
  const headerLeftBarButtonItems = [
    ...leftHeaderButtons
      .map((button) => button.props)
      .filter((props) => props.style?.display !== 'none')
      .map(convertHeaderButtonToBarButtonItem),
    ...leftMenus.map((menu, index) => ({
      index: leftHeaderButtons.length + index,
      label: menu.props.title,
      menu: {
        label: menu.props.title,
        items: getAllChildrenOfType(menu.props.children, LinkMenuAction).map(
          (action): HeaderBarButtonItemMenuAction => ({
            type: 'action',
            label: action.props.title,
            onPress: () => action.props.onPress?.(),
            attributes: action.props.destructive ? 'destructive' : undefined,
            state: action.props.isOn ? 'on' : 'off',
          })
        ),
      },
    })),
  ];
  const headerRightBarButtonItems = rightHeaderButtons
    .map((button) => button.props)
    .filter((props) => props.style?.display !== 'none')
    .map(convertHeaderButtonToBarButtonItem);
  const backButton = getFirstChildOfType(headerLeft?.props.children, StackHeaderButton);
  const headerTitle = getFirstChildOfType(header?.props.children, StackHeaderTitle);
  const backButtonTitle = Children.toArray(backButton?.props.children)
    .filter((c) => !isValidElement(c))
    .join('');
  const headerConfig: ScreenStackHeaderConfigProps = {
    headerLeftBarButtonItems,
    headerRightBarButtonItems,
    backTitle: backButtonTitle,
    backTitleFontFamily: backButton?.props.style?.fontFamily,
    backTitleFontSize: backButton?.props.style?.fontSize,
    backTitleVisible: backButton?.props.style?.display !== 'none',
    hideBackButton: backButton?.props.style?.display === 'none',
    backgroundColor: headerTitle?.props.style?.backgroundColor,
    title: headerTitle?.props.children,
    titleColor: headerTitle?.props.style?.color,
    titleFontFamily: headerTitle?.props.style?.fontFamily,
    titleFontSize: headerTitle?.props.style?.fontSize,
    hideShadow: headerTitle?.props.style?.shadowColor === 'transparent',
    largeTitle: headerTitle?.props.large,
    largeTitleFontFamily: headerTitle?.props.largeStyle?.fontFamily,
    largeTitleFontSize: headerTitle?.props.largeStyle?.fontSize,
    largeTitleColor: headerTitle?.props.largeStyle?.color,
    largeTitleHideShadow: headerTitle?.props.largeStyle?.shadowColor === 'transparent',
    largeTitleBackgroundColor: headerTitle?.props.largeStyle?.backgroundColor,
  };
  return (
    <ScreenStack style={{ flex: 1 }}>
      <ScreenStackItem screenId="1234" headerConfig={headerConfig}>
        {content}
      </ScreenStackItem>
    </ScreenStack>
  );
}

function convertHeaderButtonToBarButtonItem(
  buttonProps: ComponentProps<typeof StackHeaderButton>,
  index: number
): HeaderBarButtonItem {
  const label = getFirstChildOfType(buttonProps.children, Label);
  const title =
    label?.props.children ??
    Children.toArray(buttonProps.children)
      .filter((c) => !isValidElement(c))
      .join('');
  const badge = getFirstChildOfType(buttonProps.children, Badge);
  return {
    index,
    label: title,
    onPress: () => buttonProps.onPress?.(),
    labelStyle: {
      fontFamily: buttonProps.style?.fontFamily,
      fontSize: buttonProps.style?.fontSize,
      color: buttonProps.style?.color,
    },
    badge: badge?.props.children
      ? {
          value: badge.props.children,
        }
      : undefined,
  };
}

export const StackWithButtons = Object.assign(StackWithButtonsComponent, {
  Header: StackHeader,
});

function getFirstChildOfType<PropsT>(
  children: React.ReactNode | React.ReactNode[],
  type: (props: PropsT) => unknown
) {
  return React.Children.toArray(children).find(
    (child): child is ReactElement<PropsT> => isValidElement(child) && child.type === type
  );
}

function getAllChildrenOfType<PropsT>(
  children: React.ReactNode | React.ReactNode[],
  type: ((props: PropsT) => unknown) | React.ComponentType<PropsT>
) {
  return React.Children.toArray(children).filter(
    (child): child is ReactElement<PropsT> => isValidElement(child) && child.type === type
  );
}
