import { escapeUri } from '../Android';

describe(escapeUri, () => {
  it('escapes special characters in URI path', () => {
    expect(escapeUri('myapp://normal/characters')).toBe('myapp://normal/characters');
    expect(escapeUri('myapp://(special)/characters')).toBe('myapp://\\(special\\)/characters');
    expect(escapeUri('myapp://(spec)/(cial)/characters')).toBe(
      'myapp://\\(spec\\)/\\(cial\\)/characters'
    );
  });

  it('escapes special charactes in URI search parameter values', () => {
    expect(escapeUri('myapp://home?test=normal')).toBe('myapp://home?test=normal');
    expect(escapeUri('myapp://home?test=a|b|c')).toBe('myapp://home?test=a%257Cb%257Cc');
    expect(escapeUri('myapp://home?test=@1')).toBe('myapp://home?test=%25401');
  });

  it('escapes special characters in both URI path and search parameter values', () => {
    expect(escapeUri('myapp://(spec)/(cial)/characters?pipes=a|b|c&at=@1')).toBe(
      'myapp://\\(spec\\)/\\(cial\\)/characters?pipes=a%257Cb%257Cc&at=%25401'
    );
  });

  it('does not escape already escaped input', () => {
    expect('my-custom-app://\\(escaped\\)/already').toBe('my-custom-app://\\(escaped\\)/already');
    expect(
      escapeUri('myapp://\\(spec\\)/\\(cial\\)/characters?pipes=a%257Cb%257Cc&at=%25401')
    ).toBe('myapp://\\(spec\\)/\\(cial\\)/characters?pipes=a%257Cb%257Cc&at=%25401');
  });
});
