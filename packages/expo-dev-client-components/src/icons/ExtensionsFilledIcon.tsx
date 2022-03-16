import * as React from 'react';

import { Image } from '../Image';
import { useCurrentTheme } from '../useExpoTheme';

const activeLightIcon = require('../../assets/extensions-filled-active-icon-light.png');
const activeIcon = require('../../assets/extensions-filled-active-icon.png');
const inactiveLightIcon = require('../../assets/extensions-filled-inactive-icon-light.png');
const inactiveIcon = require('../../assets/extensions-filled-inactive-icon.png');

const iconMap = {
  light: {
    active: activeIcon,
    inactive: inactiveIcon,
  },
  dark: {
    active: activeLightIcon,
    inactive: inactiveLightIcon,
  },
};

type TabBarIconProps = Partial<React.ComponentProps<typeof Image>> & {
  focused?: boolean;
};

export function ExtensionsFilledIcon(props: TabBarIconProps) {
  const theme = useCurrentTheme();
  const themedIcon = iconMap[theme];
  const icon = props.focused ? themedIcon.active : themedIcon.inactive;
  return <Image source={icon} {...props} />;
}
