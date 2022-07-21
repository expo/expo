import { css } from '@emotion/react';
import { borderRadius, spacing, theme } from '@expo/styleguide';

import { B } from '~/components/base/paragraph';
import { PlatformIcon } from '~/components/plugins/PlatformIcon';
import { capitalize } from '~/components/plugins/api/APISectionUtils';
import { PlatformName } from '~/types/common';

type PlatformTagProps = {
  platform: PlatformName;
  firstElement?: boolean;
};

type PlatformTagsProps = {
  prefix?: string;
  platforms?: PlatformName[];
  firstElement?: boolean;
};

const getPlatformName = (text: string): PlatformName => {
  if (text.toLowerCase().includes('ios')) return 'ios';
  if (text.toLowerCase().includes('android')) return 'android';
  if (text.toLowerCase().includes('web')) return 'web';
  if (text.toLowerCase().includes('expo')) return 'expo';
  return '';
};

const formatPlatformName = (name: PlatformName) => {
  const cleanName = name.toLowerCase().replace('\n', '');
  if (cleanName.includes('ios')) {
    return cleanName.replace('ios', 'iOS');
  } else if (cleanName.includes('expo')) {
    return cleanName.replace('expo', 'Expo Go');
  } else {
    return capitalize(name);
  }
};

export const PlatformTag = ({ platform, firstElement }: PlatformTagProps) => {
  return (
    <div
      css={[
        platformTagStyle,
        firstElement && platformTagFirstStyle,
        platform === 'android' && androidPlatformTagStyle,
        platform === 'ios' && iosPlatformTagStyle,
        platform === 'web' && webPlatformTagStyle,
        platform === 'expo' && expoPlatformStyle,
      ]}>
      <PlatformIcon platform={platform} />
      <span css={platformLabelStyle}>{formatPlatformName(platform)}</span>
    </div>
  );
};

export const PlatformTags = ({ prefix, firstElement, platforms }: PlatformTagsProps) => {
  return platforms?.length ? (
    <>
      {prefix && <B>{prefix}&ensp;</B>}
      {platforms.map(getPlatformName).map(platform => {
        return <PlatformTag key={platform} platform={platform} firstElement={firstElement} />;
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
  marginTop: spacing[4],
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
