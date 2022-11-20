import { mergeContents } from '../generateCode';

const src = `
#import <Foundation/Foundation.h>
#import <React/RCTBridgeDelegate.h>
#import <UIKit/UIKit.h>

#import <Expo/Expo.h>

@interface AppDelegate : EXAppDelegateWrapper <RCTBridgeDelegate>

@end
`;

const defaultValuesForTest = {
  src,
  newSrc: 'NEW_SRC',
  tag: 'MY_TAG',
  anchor: '#import <Expo/Expo.h>',
  comment: '//',
};

describe(mergeContents, () => {
  it('should throw if anchor is not found', () => {
    function willThrow() {
      mergeContents({
        ...defaultValuesForTest,
        anchor: 'NOT_FOUND_ANCHOR',
        offset: 0,
      });
    }
    expect(willThrow).toThrow();
  });

  it('should insert before the found anchor', () => {
    const result = mergeContents({
      ...defaultValuesForTest,
      offset: 0,
    });
    // ensure the merge went ok
    expect(result.didMerge).toBe(true);
    expect(result.didClear).toBe(false);
    const tagIndex = result.contents.indexOf(defaultValuesForTest.tag);
    const anchorIndex = result.contents.indexOf(defaultValuesForTest.anchor);
    // ensure tag and anchor has been found in the result content
    expect(tagIndex).not.toBe(-1);
    expect(anchorIndex).not.toBe(-1);
    // ensure the first occurence of the tag is before the anchor
    expect(tagIndex < anchorIndex).toBe(true);
  });

  it('should insert after the found anchor', () => {
    const result = mergeContents({
      ...defaultValuesForTest,
      offset: 1,
    });
    const tagIndex = result.contents.indexOf(defaultValuesForTest.tag);
    const anchorIndex = result.contents.indexOf(defaultValuesForTest.anchor);
    // ensure the first occurence of the tag is after the anchor
    expect(tagIndex > anchorIndex).toBe(true);
  });

  it('should replace the found anchor', () => {
    const result = mergeContents({
      ...defaultValuesForTest,
      offset: 0,
      deleteCount: 1,
    });
    const anchorIndex = result.contents.indexOf(defaultValuesForTest.anchor);
    // ensure anchor is not found anymore
    expect(anchorIndex).toBe(-1);
  });
});
