import { css } from '@emotion/react';
import { spacing } from '@expo/styleguide';
import React from 'react';

import { TocLink } from './TocLink';

import { LABEL, BOLD } from '~/ui/components/Text';
import { TocColumn } from '~/ui/containers/Document';

const FAKE_DATA = [
  {
    href: '#',
    title: 'Expo CLI',
    children: [
      { href: '#', title: 'Requirements' },
      { href: '#', title: 'Installing Expo CLI' },
    ],
  },
  { href: '#', title: 'Expo Go app for Android and iOS' },
  { href: '#', title: 'Up next' },
];

export const Toc = () => (
  <TocColumn>
    <nav css={containerStyle} aria-labelledby="toc-title">
      <LABEL>
        <BOLD>On this page</BOLD>
      </LABEL>
      <ul css={listStyle}>{FAKE_DATA.map(link => renderLinks(link))}</ul>
    </nav>
  </TocColumn>
);

type Link = { href: string; title: string; children?: Link[] };

function renderLinks(link: Link, depth = 0) {
  return (
    <li key={link.title}>
      <TocLink href={link.href} depth={depth} isActive={link.title === 'Expo CLI'}>
        {link.title}
      </TocLink>
      {!!link.children && (
        <ul css={listStyle}>{link.children.map(child => renderLinks(child, depth + 1))}</ul>
      )}
    </li>
  );
}

const containerStyle = css`
  padding: 3rem 2rem;
`;

const listStyle = css`
  list-style: none;
  margin: 0;
  padding: 0;
`;
