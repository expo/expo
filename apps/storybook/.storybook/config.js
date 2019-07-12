import { withKnobs } from '@storybook/addon-knobs';
import { addDecorator, addParameters, configure } from '@storybook/react';
import { create } from '@storybook/theming';
import * as React from 'react';
import requireContext from 'require-context.macro';

import centered from './decorator-centered';
import loadStory from './loadStory';

addDecorator(centered);

addDecorator(withKnobs({ escapeHTML: false, skipIfNoParametersOrOptions: true }));

const colors = {
  purple: '#4630EB',
  secondary: 'rgba(0,0,0,0)',
};
const expoTheme = {
  colorPrimary: colors.purple,
  colorSecondary: colors.purple,

  // UI
  appBg: '#F3F3F3',
  appContentBg: 'white',
  appBorderColor: 'grey',
  appBorderRadius: 4,

  // Typography
  fontBase: '"Open Sans", sans-serif',
  fontCode: 'monospace',

  // Text colors
  textColor: 'rgba(0, 0, 32, 0.9)',
  textInverseColor: 'rgba(255,255,255,0.9)',

  // Toolbar default and active colors
  barTextColor: 'rgba(0, 0, 32, 0.9)',
  barSelectedColor: colors.purple,
  barBg: 'white',

  // Form colors
  inputBg: '#FFFFFF',
  inputBorder: 'rgba(0,0,0,.1)',
  inputBorderRadius: 4,
  inputTextColor: '#333333',

  // Brand
  brandTitle: 'Expo',
  brandUrl: 'https://github.com/expo/expo/tree/master/apps/storybook',
  gridCellSize: 12,
  brandImage: require('../assets/brand-icon.png'),
};

export const theme = create(expoTheme);
addParameters({
  options: {
    isFullscreen: false,
    showAddonsPanel: false,
    showSearchBox: false,
    panelPosition: 'right',
    sortStoriesByKind: true,
    hierarchySeparator: /\./,
    hierarchyRootSeparator: /\|/,
    enableShortcuts: true,
    theme,
  },
});


function loadStories() {
  // automatically import all story js files that end with *.stories.js
  const req = requireContext('../stories', true, /\.stories\.jsx?$/);
  const mdreq = requireContext('../stories', true, /\.notes\.md$/);
  // loadModule('./apis/Accelerometer.stories.jsx');
  req.keys().forEach(filename => loadStory(filename, req, mdreq));
}

configure(loadStories, module);
