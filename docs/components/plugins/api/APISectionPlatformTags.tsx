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

import { B } from '~/components/base/paragraph';
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

const getPlatformName = ({ text }: CommentTagData) => {
  if (text.includes('ios')) return 'ios';
  if (text.includes('android')) return 'android';
  if (text.includes('web')) return 'web';
  if (text.includes('expo')) return 'expo';
  return undefined;
};

const renderPlatformIcon = (platform: CommentTagData) => {
  const iconProps = { size: iconSize.micro };

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
        />
      );
    default:
      return undefined;
  }
};

type Props = {
  comment?: CommentData;
  prefix?: string;
  firstElement?: boolean;
};

export const PlatformTags = ({ comment, prefix, firstElement }: Props) => {
  const platforms = getAllTagData('platform', comment);
  return platforms?.length ? (
    <>
      {prefix && <B>{prefix}&ensp;</B>}
      {platforms.map(platform => {
        const platformName = getPlatformName(platform);
        return (
          <div
            key={platformName}
            css={[
              platformTagStyle,
              firstElement && platformTagFirstStyle,
              platformName === 'android' && androidPlatformTagStyle,
              platformName === 'ios' && iosPlatformTagStyle,
              platformName === 'web' && webPlatformTagStyle,
              platformName === 'expo' && expoPlatformStyle,
            ]}>
            {renderPlatformIcon(platform)}
            <span css={platformLabelStyle}>{formatPlatformName(platform.text)}</span>
          </div>
        );
      })}
      {prefix && <br />}
    </>
  ) : null;
};

const platformTagStyle = css({
  display: 'inline-flex',
  backgroundColor: theme.background.tertiary,
  color: theme.text.default,
  fontSize: '90%',
  fontWeight: 700,
  padding: `${spacing[1]}px ${spacing[2]}px`,
  marginBottom: spacing[3],
  marginRight: spacing[2],
  borderRadius: borderRadius.small,
  border: `1px solid ${theme.border.default}`,
  alignItems: 'center',
  gap: spacing[1],

  'table &': {
    marginTop: 0,
    marginBottom: spacing[2],
    padding: `${spacing[0.5]}px ${spacing[1.5]}px`,
  },
});

const platformTagFirstStyle = css({
  marginBottom: 0,
  marginTop: spacing[3],
});

const platformLabelStyle = css({
  lineHeight: `${spacing[4]}px`,
});

const androidPlatformTagStyle = css({
  backgroundColor: theme.palette.green['000'],
  color: theme.palette.green[900],
  borderColor: theme.palette.green[200],
});

const iosPlatformTagStyle = css({
  backgroundColor: theme.palette.blue['000'],
  color: theme.palette.blue[900],
  borderColor: theme.palette.blue[200],
});

const webPlatformTagStyle = css({
  backgroundColor: theme.palette.orange['000'],
  color: theme.palette.orange[900],
  borderColor: theme.palette.orange[200],
});

const expoPlatformStyle = css({
  backgroundColor: theme.palette.purple['000'],
  color: theme.palette.purple[900],
  borderColor: theme.palette.purple[200],
});
