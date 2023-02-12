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

export const getTagStyle = (platform: string) => {
  switch (platform) {
    case 'android': {
      return css({
        backgroundColor: theme.palette.green4,
        color: theme.palette.green12,
        borderColor: theme.palette.green5,
      });
    }
    case 'ios': {
      return css({
        backgroundColor: theme.palette.blue4,
        color: theme.palette.blue12,
        borderColor: theme.palette.blue5,
      });
    }
    case 'web': {
      return css({
        backgroundColor: theme.palette.orange4,
        color: theme.palette.orange12,
        borderColor: theme.palette.orange5,
      });
    }
    case 'expo': {
      return css({
        backgroundColor: theme.palette.purple4,
        color: theme.palette.purple12,
        borderColor: theme.palette.purple5,
      });
    }
  }
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
