import {
  navigationBarBackButtonHidden,
  navigationBarTitleDisplayMode,
  navigationSplitViewColumnWidth,
  navigationSplitViewStyle,
  toolbarVisibility,
} from '..';

it('creates navigation modifiers', () => {
  expect(navigationBarTitleDisplayMode('inline')).toEqual({
    $type: 'navigationBarTitleDisplayMode',
    mode: 'inline',
  });
  expect(navigationBarBackButtonHidden()).toEqual({
    $type: 'navigationBarBackButtonHidden',
    hidden: true,
  });
  expect(navigationBarBackButtonHidden(false)).toEqual({
    $type: 'navigationBarBackButtonHidden',
    hidden: false,
  });
  expect(toolbarVisibility('hidden')).toEqual({
    $type: 'toolbarVisibility',
    visibility: 'hidden',
    bars: ['navigationBar'],
  });
  expect(toolbarVisibility('visible', ['bottomBar', 'tabBar'])).toEqual({
    $type: 'toolbarVisibility',
    visibility: 'visible',
    bars: ['bottomBar', 'tabBar'],
  });
  expect(navigationSplitViewStyle('balanced')).toEqual({
    $type: 'navigationSplitViewStyle',
    style: 'balanced',
  });
});

it('creates fixed and flexible split view column width modifiers', () => {
  expect(navigationSplitViewColumnWidth(320)).toEqual({
    $type: 'navigationSplitViewColumnWidth',
    width: 320,
  });
  expect(navigationSplitViewColumnWidth({ min: 280, ideal: 320, max: 400 })).toEqual({
    $type: 'navigationSplitViewColumnWidth',
    min: 280,
    ideal: 320,
    max: 400,
  });
});
