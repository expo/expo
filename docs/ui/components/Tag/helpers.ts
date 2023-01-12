import { css } from '@emotion/react';
import { theme } from '@expo/styleguide';

import { capitalize } from '~/components/plugins/api/APISectionUtils';
import { PlatformName } from '~/types/common';

export const getPlatformName = (text: string): PlatformName => {
  if (text.toLowerCase().includes('ios')) return 'ios';
  if (text.toLowerCase().includes('android')) return 'android';
  if (text.toLowerCase().includes('web')) return 'web';
  if (text.toLowerCase().includes('expo')) return 'expo';
  return '';
};

export const getTagStyle = (color: string) => {
  return css({
    // @ts-ignore
    backgroundColor: theme.palette[`${color}2`],
    // @ts-ignore
    color: theme.palette[`${color}12`],
    // @ts-ignore
    borderColor: theme.palette[`${color}5`],
  });
};

export const formatName = (name: PlatformName) => {
  const cleanName = name.toLowerCase().replace('\n', '');
  if (cleanName.includes('ios')) {
    return cleanName.replace('ios', 'iOS');
  } else if (cleanName.includes('expo')) {
    return cleanName.replace('expo', 'Expo Go');
  } else {
    return capitalize(name);
  }
};
