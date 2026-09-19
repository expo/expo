Object.defineProperty(globalThis, '__DEV__', {
  value: false,
  configurable: true,
});

jest.mock('expo', () => ({
  requireNativeModule: jest.fn(() => ({})),
}));

const { searchable, searchToolbarBehavior } = require('../swift-ui/modifiers');

const state = { __expo_shared_object_id__: 42 };

describe('searchable', () => {
  it('passes the state id and leaves the options undefined by default', () => {
    expect(searchable(state)).toEqual({
      $type: 'searchable',
      text: 42,
      placement: undefined,
      prompt: undefined,
    });
  });

  it('accepts a placement and a prompt', () => {
    expect(searchable(state, { placement: 'toolbar', prompt: 'Search agents' })).toEqual({
      $type: 'searchable',
      text: 42,
      placement: 'toolbar',
      prompt: 'Search agents',
    });
  });

  it('unwraps the text of the native event for onChange', () => {
    const onChange = jest.fn();
    const modifier = searchable(state, { onChange });

    modifier.eventListener({ text: 'expo' });
    expect(onChange).toHaveBeenCalledWith('expo');

    modifier.eventListener({});
    expect(onChange).toHaveBeenLastCalledWith('');
  });
});

describe('searchToolbarBehavior', () => {
  it('passes the behavior through', () => {
    expect(searchToolbarBehavior('minimize')).toEqual({
      $type: 'searchToolbarBehavior',
      behavior: 'minimize',
    });
  });
});
