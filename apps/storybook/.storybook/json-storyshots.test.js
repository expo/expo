import initStoryshots from '@storybook/addon-storyshots';

jest.setTimeout(30000);

initStoryshots({
  suite: 'JSON',
});
