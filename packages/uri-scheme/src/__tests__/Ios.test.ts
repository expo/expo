import { escapeUri } from '../Ios';

describe(escapeUri, () => {
  it('escapes special charactes in URI search parameter values', () => {
    expect(escapeUri('myapp://home?test=normal')).toBe('myapp://home?test=normal');
    expect(escapeUri('myapp://(app)/home?test=@1')).toBe('myapp://(app)/home?test=%401');
    expect(escapeUri('myapp://(app)/home?test=a|b|c')).toBe('myapp://(app)/home?test=a%7Cb%7Cc');
    expect(escapeUri('myapp://auto?email=jack@test.de')).toBe('myapp://auto?email=jack%40test.de');
  });

  it('does not escape already escaped input', () => {
    expect(escapeUri('my-custom-app://(app)/home?test=%401')).toBe(
      'my-custom-app://(app)/home?test=%401'
    );
    expect(escapeUri('myapp://(app)/home?test=a%7Cb%7Cc')).toBe(
      'myapp://(app)/home?test=a%7Cb%7Cc'
    );
  });
});
