import { omitUserOverridden } from '../modifierUtils';

describe('omitUserOverridden', () => {
  it('returns the derived modifiers as-is when the user supplies none', () => {
    const derived = [{ $type: 'background', color: 'red' }];
    expect(omitUserOverridden(derived, undefined)).toEqual(derived);
    expect(omitUserOverridden(derived, [])).toEqual(derived);
  });

  it('drops derived modifiers whose $type the user supplied', () => {
    const derived = [
      { $type: 'background', color: 'red' },
      { $type: 'padding', all: 8 },
    ];
    expect(omitUserOverridden(derived, [{ $type: 'padding', top: 4 }])).toEqual([
      { $type: 'background', color: 'red' },
    ]);
  });

  it('only drops derived modifiers, never user ones', () => {
    const derived = [{ $type: 'padding', all: 8 }];
    const user = [
      { $type: 'padding', top: 4 },
      { $type: 'padding', bottom: 2 },
    ];
    expect(omitUserOverridden(derived, user)).toEqual([]);
  });
});
