import {
  getScreenIdForLinking,
  createQueryString,
  getSelectedTestNames,
} from '../getScreenIdForLinking';

describe(getScreenIdForLinking, () => {
  it('should normalize derived routes to lowercase and trim', () => {
    expect(getScreenIdForLinking({ name: ' MyScreen ' })).toBe('myscreen');
  });

  it('should preserve case for explicit routes and trim', () => {
    expect(getScreenIdForLinking({ name: 'MyScreen', route: ' custom-route ' })).toBe(
      'custom-route'
    );
    expect(getScreenIdForLinking({ name: 'MyScreen', route: ' ui/textInput ' })).toBe(
      'ui/textInput'
    );
  });

  it('should convert spaces to hyphens', () => {
    expect(getScreenIdForLinking({ name: 'Video Thumbnails' })).toBe('video-thumbnails');
    expect(getScreenIdForLinking({ name: 'Updates Reload Screen' })).toBe('updates-reload-screen');
  });

  it('should handle parentheses content by incorporating it with hyphens', () => {
    expect(getScreenIdForLinking({ name: 'Cellular (device-only)' })).toBe('cellular-device-only');
    expect(getScreenIdForLinking({ name: 'Brightness (device-only)' })).toBe(
      'brightness-device-only'
    );
  });

  it('should remove special characters', () => {
    expect(getScreenIdForLinking({ name: 'Test & Examples' })).toBe('test-examples');
    expect(getScreenIdForLinking({ name: "User's Profile" })).toBe('users-profile');
  });

  it('should collapse multiple hyphens', () => {
    expect(getScreenIdForLinking({ name: 'Test  -  Screen' })).toBe('test-screen');
  });

  it('should prefer explicit route over derived route', () => {
    expect(getScreenIdForLinking({ name: 'Cellular (device-only)', route: 'cellular' })).toBe(
      'cellular'
    );
  });
});

describe(createQueryString, () => {
  it('should join normalized test names with commas', () => {
    expect(createQueryString([' Test1 ', 'TEST2', 'test1'])).toBe('test1,test2');
  });
});

describe(getSelectedTestNames, () => {
  it('should split and normalize query string', () => {
    expect(getSelectedTestNames(' Test1 , Test2 ')).toEqual(['test1', 'test2']);
  });
});
