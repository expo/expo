import { css } from '@emotion/react';
import {
  AndroidIcon,
  AppleIcon,
  AtSignIcon,
  borderRadius,
  ExpoGoLogo,
  iconSize,
  spacing,
  theme,
} from '@expo/styleguide';
import React from 'react';

import { CommentData, CommentTagData } from '~/components/plugins/api/APIDataTypes';
import { capitalize, getAllTagData } from '~/components/plugins/api/APISectionUtils';

const formatPlatformName = (name: string) => {
  const cleanName = name.toLowerCase().replace('\n', '');
  if (cleanName.includes('ios')) {
    return cleanName.replace('ios', 'iOS');
  } else if (cleanName.includes('expo')) {
    return cleanName.replace('expo', 'Expo Go');
  } else {
    return capitalize(name);
  }
};

const getPlatformName = (platform: CommentTagData) => {
  if (platform.text.includes('ios')) return 'ios';
  if (platform.text.includes('android')) return 'android';
  if (platform.text.includes('web')) return 'web';
  if (platform.text.includes('expo')) return 'expo';
  return undefined;
};

const renderPlatformIcon = (platform: CommentTagData) => {
  const iconProps = { size: iconSize.micro, css: STYLES_PLATFORM_ICON };

  switch (getPlatformName(platform)) {
    case 'ios':
      return <AppleIcon color={theme.palette.blue['900']} {...iconProps} />;
    case 'android':
      return <AndroidIcon color={theme.palette.green['900']} {...iconProps} />;
    case 'web':
      return <AtSignIcon color={theme.palette.orange['900']} {...iconProps} />;
    case 'expo':
      return (
        <ExpoGoLogo
          width={iconProps.size}
          height={iconProps.size}
          color={theme.palette.purple['900']}
          css={iconProps.css}
        />
      );
    default:
      return undefined;
  }
};

type Props = {
  comment?: CommentData;
};

export const PlatformTags = ({ comment }: Props) => {
  const platforms = getAllTagData('platform', comment);
  return platforms?.length ? (
    <>
      {platforms.map(platform => {
        const platformName = getPlatformName(platform);
        return (
          <div
            key={platformName}
            css={[
              STYLES_PLATFORM,
              platformName === 'android' && STYLES_ANDROID_PLATFORM,
              platformName === 'ios' && STYLES_IOS_PLATFORM,
              platformName === 'web' && STYLES_WEB_PLATFORM,
              platformName === 'expo' && STYLES_EXPO_PLATFORM,
            ]}>
            {renderPlatformIcon(platform)}
            {formatPlatformName(platform.text)}
          </div>
        );
      })}
    </>
  ) : null;
};

export const STYLES_PLATFORM = css`
  display: inline-block;
  background-color: ${theme.background.tertiary};
  color: ${theme.text.default};
  font-size: 90%;
  font-weight: 700;
  padding: ${spacing[1]}px ${spacing[2]}px;
  margin-bottom: ${spacing[3]}px;
  margin-right: ${spacing[2]}px;
  border-radius: ${borderRadius.small}px;
  border: 1px solid ${theme.border.default};

  table & {
    margin-bottom: ${spacing[2]}px;
    padding: 0 ${spacing[1.5]}px;
  }
`;

export const STYLES_PLATFORM_ICON = css({
  marginRight: spacing[1],
  marginBottom: spacing[0.5],
  verticalAlign: 'middle',
});

export const STYLES_ANDROID_PLATFORM = css`
  background-color: ${theme.palette.green['000']};
  color: ${theme.palette.green['900']};
  border-color: ${theme.palette.green['200']};
`;

export const STYLES_IOS_PLATFORM = css`
  background-color: ${theme.palette.blue['000']};
  color: ${theme.palette.blue['900']};
  border-color: ${theme.palette.blue['200']};
`;

export const STYLES_WEB_PLATFORM = css`
  background-color: ${theme.palette.orange['000']};
  color: ${theme.palette.orange['900']};
  border-color: ${theme.palette.orange['200']};
`;

export const STYLES_EXPO_PLATFORM = css`
  background-color: ${theme.palette.purple['000']};
  color: ${theme.palette.purple['900']};
  border-color: ${theme.palette.purple['200']};
`;
