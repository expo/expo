import { escapeUri } from '../Ios';

describe(escapeUri, () => {
  it('escapes special charactes in URI search parameter values', () => {
    expect(escapeUri('myapp://home?test=normal')).toBe('myapp://home?test=normal');
    expect(escapeUri('myapp://(app)/home?test=@1')).toBe('myapp://(app)/home?test=%25401');
    expect(escapeUri('myapp://(app)/home?test=a|b|c')).toBe(
      'myapp://(app)/home?test=a%257Cb%257Cc'
    );
  });

  it('does not escape already escaped input', () => {
    expect(escapeUri('my-custom-app://(app)/home?test=%25401')).toBe(
      'my-custom-app://(app)/home?test=%25401'
    );
    expect(escapeUri('myapp://(app)/home?test=a%257Cb%257Cc')).toBe(
      'myapp://(app)/home?test=a%257Cb%257Cc'
    );
  });
});
