import {
  findObjcFunctionCodeBlock,
  findObjcInterfaceCodeBlock,
  findSwiftFunctionCodeBlock,
  insertContentsInsideObjcFunctionBlock,
  insertContentsInsideObjcInterfaceBlock,
  insertContentsInsideSwiftClassBlock,
  insertContentsInsideSwiftFunctionBlock,
} from '../codeMod';

describe(findObjcInterfaceCodeBlock, () => {
  it('should find class interface', () => {
    const contents = `\
#import <Foundation/Foundation.h>

@interface Foo : NSObject
{
  int value;
}

- (void)doSomething;
@end

// some comments`;

    const expectContents = `\
@interface Foo : NSObject
{
  int value;
}

- (void)doSomething;
@end`;

    expect(findObjcInterfaceCodeBlock(contents, '@interface Foo')).toEqual({
      start: 35,
      end: 104,
      code: expectContents,
    });
  });

  it('should find class category', () => {
    const contents = `\
@interface Foo() <SomeProtocol> {
  int value;
}

- (void)doSomething;
@end

// some comments`;

    const expectContents = `\
@interface Foo() <SomeProtocol> {
  int value;
}

- (void)doSomething;
@end`;

    expect(findObjcInterfaceCodeBlock(contents, '@interface Foo')).toEqual({
      start: 0,
      end: 75,
      code: expectContents,
    });
  });

  it('should find class implementation', () => {
    const contents = `\
#import <Foundation/Foundation.h>

@interface Foo() <SomeProtocol> {
  int value;
}

@implementation Foo

- (void)doSomething
{
  // ...
}

@end

// some comments`;

    const expectContents = `\
@implementation Foo

- (void)doSomething
{
  // ...
}

@end`;

    expect(findObjcInterfaceCodeBlock(contents, '@implementation Foo')).toEqual({
      start: 85,
      end: 144,
      code: expectContents,
    });
  });

  it('should returns null if not found', () => {
    expect(findObjcInterfaceCodeBlock('', '@interface NotFound')).toBe(null);
  });
});

describe(findObjcFunctionCodeBlock, () => {
  it('should find function selector without arguments', () => {
    const contents = `\
// comments
- (void)foo
{
  [self doSomething];
}
// comments`;

    const expectContents = `\
{
  [self doSomething];
}`;
    expect(findObjcFunctionCodeBlock(contents, 'foo')).toEqual({
      start: 24,
      end: 48,
      code: expectContents,
    });
  });

  it('should find function selector with one argument', () => {
    const contents = `\
// comments
- (void)foo:(NSString *)value
{
  [self doSomething];
}
// comments`;

    const expectContents = `\
{
  [self doSomething];
}`;
    expect(findObjcFunctionCodeBlock(contents, 'foo:')).toEqual({
      start: 42,
      end: 66,
      code: expectContents,
    });
  });

  it('should find function selector with two arguments', () => {
    const contents = `\
// comments
- (void)foo:(NSString *)value withBar:(NSString *)barValue
{
  [self doSomething];
}
// comments`;

    const expectContents = `\
{
  [self doSomething];
}`;
    expect(findObjcFunctionCodeBlock(contents, 'foo:withBar:')).toEqual({
      start: 71,
      end: 95,
      code: expectContents,
    });
  });

  it('should return null if selector function not found', () => {
    const contents = `
// comments
- (void)foo:(NSString *)value
{
  [self doSomething];
}
// comments`;

    expect(findObjcFunctionCodeBlock(contents, 'foo')).toBe(null);
  });
});

describe(insertContentsInsideObjcFunctionBlock, () => {
  it('should support prepend code to the head', () => {
    const rawContents = `
- (void)doSomething:(NSString *)value
{
  [self doAnotherThing];
}`;

    const expectContents = `
- (void)doSomething:(NSString *)value
{
  NSLog(@"value=%@", value);
  [self doAnotherThing];
}`;

    expect(
      insertContentsInsideObjcFunctionBlock(
        rawContents,
        'doSomething:',
        'NSLog(@"value=%@", value);',
        {
          position: 'head',
        }
      )
    ).toEqual(expectContents);
  });

  it('should support append code to the tail', () => {
    const rawContents = `
- (void)doSomething:(NSString *)value
{
  [self doAnotherThing];
}`;

    const expectContents = `
- (void)doSomething:(NSString *)value
{
  [self doAnotherThing];
  NSLog(@"value=%@", value);
}`;

    expect(
      insertContentsInsideObjcFunctionBlock(
        rawContents,
        'doSomething:',
        'NSLog(@"value=%@", value);',
        {
          position: 'tail',
        }
      )
    ).toEqual(expectContents);
  });

  it('should support append code to the tail but before the last return', () => {
    const rawContents = `
- (BOOL)doSomething:(NSString *)value
{
  [self doAnotherThing];
  return YES;
}`;

    const expectContents = `
- (BOOL)doSomething:(NSString *)value
{
  [self doAnotherThing];
  NSLog(@"value=%@", value);
  return YES;
}`;

    expect(
      insertContentsInsideObjcFunctionBlock(
        rawContents,
        'doSomething:',
        'NSLog(@"value=%@", value);',
        {
          position: 'tailBeforeLastReturn',
        }
      )
    ).toEqual(expectContents);
  });
});

describe(insertContentsInsideObjcInterfaceBlock, () => {
  it('should support append new function into class implementation', () => {
    const contents = `\
@interface Foo() <SomeProtocol> {
  int value;
}

@implementation Foo

- (void)doSomething
{
  // ...
}

@end`;

    const expectContents = `\
@interface Foo() <SomeProtocol> {
  int value;
}

@implementation Foo

- (void)doSomething
{
  // ...
}

- (BOOL)isFoo
{
  return YES;
}

@end`;

    expect(
      insertContentsInsideObjcInterfaceBlock(
        contents,
        '@interface Foo',
        `\
- (BOOL)isFoo
{
  return YES;
}\n
`,
        { position: 'tail' }
      )
    ).toEqual(expectContents);
  });
});

describe(findSwiftFunctionCodeBlock, () => {
  it('should find function with match selector', () => {
    const contents = `
class Foo: NSObject {
  func doSomething() {
    print("Hello!")
  }

  func doSomething(forName name: String) -> Bool {
    return true
  }

  func doSomething(_ name: String, withValue value: String) {
    print("Hello \\(name) - value[\\(value)]!")
  }
}
`;
    expect(findSwiftFunctionCodeBlock(contents, 'doSomething(_:withValue:)')).toEqual({
      start: 203,
      end: 253,
      code: ['{', '    print("Hello \\(name) - value[\\(value)]!")', '  }'].join('\n'),
    });
  });
});

describe(insertContentsInsideSwiftClassBlock, () => {
  it('should support adding new property inside class code block', () => {
    const contents = `
// comments
class Foo: NSObject {
  func doSomething() {
    // ...
  }
}`;

    const expectContents = `
// comments
class Foo: NSObject {
  var Value: String?

  func doSomething() {
    // ...
  }
}`;

    expect(
      insertContentsInsideSwiftClassBlock(contents, 'class Foo', '\n  var Value: String?\n', {
        position: 'head',
      })
    ).toEqual(expectContents);
  });
});

describe(insertContentsInsideSwiftFunctionBlock, () => {
  it('should support prepend code to the head', () => {
    const rawContents = `
func doSomething(_ value: String!) {
  self.doAnotherThing()
}`;

    const expectContents = `
func doSomething(_ value: String!) {
  print("value=\\(value)")
  self.doAnotherThing()
}`;

    expect(
      insertContentsInsideSwiftFunctionBlock(
        rawContents,
        'doSomething(_:)',
        'print("value=\\(value)")',
        {
          position: 'head',
        }
      )
    ).toEqual(expectContents);
  });

  it('should support append code to the tail', () => {
    const rawContents = `
func doSomething(_ value: String!) {
  self.doAnotherThing()
}`;

    const expectContents = `
func doSomething(_ value: String!) {
  self.doAnotherThing()
  print("value=\\(value)")
}`;

    expect(
      insertContentsInsideSwiftFunctionBlock(
        rawContents,
        'doSomething(_:)',
        'print("value=\\(value)")',
        {
          position: 'tail',
        }
      )
    ).toEqual(expectContents);
  });

  it('should support append code to the tail but before the last return', () => {
    const rawContents = `
func doSomething(_ value: String!) -> Bool {
  self.doAnotherThing()
  return true
}`;

    const expectContents = `
func doSomething(_ value: String!) -> Bool {
  self.doAnotherThing()
  print("value=\\(value)")
  return true
}`;

    expect(
      insertContentsInsideSwiftFunctionBlock(
        rawContents,
        'doSomething(_:)',
        'print("value=\\(value)")',
        {
          position: 'tailBeforeLastReturn',
        }
      )
    ).toEqual(expectContents);
  });
});
