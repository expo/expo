import { withOptions } from '@storybook/addon-options';
import centered from './decorator-centered';
import { configure, addDecorator } from '@storybook/react';
import requireContext from 'require-context.macro';

const context = requireContext('../stories', true, /Screen\.js$/);

addDecorator(centered);

withOptions({
  name: 'Expo',
  url: 'https://',
  goFullScreen: false,
  addonPanelInRight: false,
  showSearchBox: false,
  showAddonPanel: false,
  showStoriesPanel: true,
});

function loadStories() {
  context.keys().forEach(context);
}

configure(loadStories, module);
