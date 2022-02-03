import * as React from 'react';

import { Image } from '../Image';

const activeIcon = require('../../assets/settings-filled-active-icon.png');
const inactiveIcon = require('../../assets/settings-filled-inactive-icon.png');

type TabBarIconProps = Partial<React.ComponentProps<typeof Image>> & {
  focused?: boolean;
};

export function SettingsFilledIcon(props: TabBarIconProps) {
  const icon = props.focused ? activeIcon : inactiveIcon;
  return <Image source={icon} {...props} />;
}
