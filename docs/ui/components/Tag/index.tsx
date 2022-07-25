import { css } from '@emotion/react';
import { borderRadius, spacing, theme } from '@expo/styleguide';

import { formatName, getPlatformName, getTagStyle } from './helpers';

import { B } from '~/components/base/paragraph';
import { PlatformIcon } from '~/components/plugins/PlatformIcon';
import { PlatformName } from '~/types/common';

type TagProps = {
  name: string;
  firstElement?: boolean;
  toc?: boolean;
};

type PlatformTagProps = Omit<TagProps, 'name'> & {
  platform: PlatformName;
};

type StatusTagProps = Omit<TagProps, 'name'> & {
  status: 'deprecated' | 'experimental' | string;
};

type PlatformTagsProps = {
  prefix?: string;
  platforms?: PlatformName[];
  firstElement?: boolean;
};

export const Tag = ({ name, ...rest }: TagProps) => {
  if (getPlatformName(name).length) {
    return <PlatformTag platform={name} {...rest} />;
  } else {
    return <StatusTag status={name} {...rest} />;
  }
};

export const StatusTag = ({ status, firstElement, toc }: StatusTagProps) => {
  return (
    <div
      css={[
        tagStyle,
        firstElement && tagFirstStyle,
        status === 'deprecated' && getTagStyle('yellow'),
        status === 'experimental' && getTagStyle('pink'),
        toc && tagToCStyle,
      ]}>
      <span css={labelStyle}>{formatName(status)}</span>
    </div>
  );
};

export const PlatformTag = ({ platform, firstElement, toc }: PlatformTagProps) => {
  const platformName = getPlatformName(platform);

  return (
    <div
      css={[
        tagStyle,
        firstElement && tagFirstStyle,
        platformName === 'android' && getTagStyle('green'),
        platformName === 'ios' && getTagStyle('blue'),
        platformName === 'web' && getTagStyle('orange'),
        platformName === 'expo' && getTagStyle('purple'),
        toc && tagToCStyle,
      ]}>
      {!toc && <PlatformIcon platform={platformName} />}
      <span css={labelStyle}>{formatName(platform)}</span>
    </div>
  );
};

export const PlatformTags = ({ prefix, firstElement, platforms }: PlatformTagsProps) => {
  return platforms?.length ? (
    <>
      {prefix && <B>{prefix}&ensp;</B>}
      {platforms.map(platform => {
        return <PlatformTag key={platform} platform={platform} firstElement={firstElement} />;
      })}
      {prefix && <br />}
    </>
  ) : null;
};

const tagStyle = css({
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

const tagFirstStyle = css({
  marginBottom: 0,
  marginTop: spacing[4],
});

const labelStyle = css({
  lineHeight: `${spacing[4]}px`,
});

const tagToCStyle = css({
  fontSize: '0.7rem',
  marginBottom: 0,
  marginRight: 0,
  marginLeft: spacing[1],
  padding: `0px ${spacing[1.5]}px`,
});
