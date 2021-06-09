import { css } from '@emotion/react';
import { theme } from '@expo/styleguide';
import * as React from 'react';

import { H4 } from '~/components/base/headings';
import { CheckCircle } from '~/components/icons/CheckCircle';
import { PendingCircle } from '~/components/icons/PendingCircle';
import { XCircle } from '~/components/icons/XCircle';
import { ElementType } from '~/types/common';

const STYLES_TITLE = css`
  margin-bottom: 1rem;
`;

const STYLES_LINK = css`
  text-decoration: none;
  display: grid;
  grid-template-columns: 20px auto;
  text-align: left;
  grid-gap: 8px;
  color: ${theme.link.default};
`;

const STYLES_TABLE = css`
  table-layout: fixed;
`;

const platforms = [
  { title: 'Android Device', propName: 'android' },
  { title: 'Android Emulator', propName: 'emulator' },
  { title: 'iOS Device', propName: 'ios' },
  { title: 'iOS Simulator', propName: 'simulator' },
  { title: 'Web', propName: 'web' },
];

type Platform = ElementType<typeof platforms>;
type IsSupported = boolean | undefined | { pending: string };

function getInfo(isSupported: IsSupported, { title }: Platform) {
  if (isSupported === true) {
    return {
      children: <CheckCircle size={20} />,
      title: `${title} is supported`,
    };
  } else if (typeof isSupported === 'object') {
    return {
      children: (
        <a css={STYLES_LINK} target="_blank" href={isSupported.pending}>
          <PendingCircle size={20} /> Pending
        </a>
      ),
      title: `${title} support is pending`,
    };
  }

  return {
    children: <XCircle size={20} />,
    title: `${title} is not supported`,
  };
}

type Props = {
  title?: string;
  ios?: boolean;
  android?: boolean;
  web?: boolean;
  simulator?: boolean;
  emulator?: boolean;
};

type PlatformProps = Omit<Props, 'title'>;

export default class PlatformsSection extends React.Component<Props> {
  render() {
    return (
      <div>
        <H4 css={STYLES_TITLE}>{this.props.title || 'Platform Compatibility'}</H4>
        <table css={STYLES_TABLE}>
          <thead>
            <tr>
              {platforms.map(({ title }) => (
                <th key={title}>{title}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {platforms.map(platform => (
                <td
                  key={platform.title}
                  {...getInfo(this.props[platform.propName as keyof PlatformProps], platform)}
                />
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    );
  }
}
