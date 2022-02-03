import * as React from 'react';

import { Image } from '../Image';

const activeIcon = require('../../assets/home-filled-active-icon.png');
const inactiveIcon = require('../../assets/home-filled-inactive-icon.png');

type TabBarIconProps = Partial<React.ComponentProps<typeof Image>> & {
  focused?: boolean;
};

export function HomeFilledIcon(props: TabBarIconProps) {
  const icon = props.focused ? activeIcon : inactiveIcon;
  return <Image source={icon} {...props} />;
}
