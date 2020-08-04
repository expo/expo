// Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
//
// You are hereby granted a non-exclusive, worldwide, royalty-free license to use,
// copy, modify, and distribute this software in source code or binary form for use
// in connection with the web services and APIs provided by Facebook.
//
// As with any software that integrates with the Facebook platform, your use of
// this software is subject to the Facebook Developer Principles and Policies
// [http://developers.facebook.com/policy/]. This copyright notice shall be
// included in all copies or substantial portions of the software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
// FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
// COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
// IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
// CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

#import "FBSDKLibAnalyzer.h"

#import <objc/runtime.h>

@implementation FBSDKLibAnalyzer

static NSMutableDictionary<NSString *, NSString *> *_methodMapping;

+ (void)initialize
{
  _methodMapping = [NSMutableDictionary dictionary];
}

+ (NSDictionary<NSString *, NSString *> *)getMethodsTable:(NSArray<NSString *> *)prefixes
                                               frameworks:(NSArray<NSString *> *)frameworks
{
  NSArray<NSString *> *allClasses = [self getClassNames:prefixes frameworks:frameworks];
  for (NSString *className in allClasses) {
    Class class = NSClassFromString(className);
    if (class) {
      [self addClass:class isClassMethod:NO];
      [self addClass:object_getClass(class) isClassMethod:YES];
    }
  }
  return [_methodMapping copy];
}

#pragma mark - private methods

+ (NSArray<NSString *> *)getClassNames:(NSArray<NSString *> *)prefixes
                            frameworks:(NSArray<NSString *> *)frameworks
{
  NSMutableArray<NSString *> *classNames = [NSMutableArray new];
  // from main bundle
  [classNames addObjectsFromArray:[self getClassesFrom:[[NSBundle mainBundle] executablePath]
                                              prefixes:prefixes]];
  // from dynamic libraries
  if (frameworks.count > 0) {
    unsigned int count = 0;
    const char **images = objc_copyImageNames(&count);
    for (int i = 0; i < count; i++) {
      NSString *image = [NSString stringWithUTF8String:images[i]];
      for (NSString *framework in frameworks) {
        if ([image containsString:framework]) {
          [classNames addObjectsFromArray:[self getClassesFrom:image
                                                      prefixes:nil]];
        }
      }
    }
    free(images);
  }

  return [classNames copy];
}

+ (NSArray<NSString *> *)getClassesFrom:(NSString *)image
                               prefixes:(NSArray<NSString *> *)prefixes
{
  NSMutableArray<NSString *> *classNames = [NSMutableArray array];
  unsigned int count = 0;
  const char **classes = objc_copyClassNamesForImage([image UTF8String], &count);
  for (unsigned int i = 0; i < count; i++){
    NSString *className = [NSString stringWithUTF8String:classes[i]];
    if (prefixes.count > 0) {
      for (NSString *prefix in prefixes) {
        if ([className hasPrefix:prefix]) {
          [classNames addObject:className];
          break;
        }
      }
    } else {
      [classNames addObject:className];
    }
  }
  free(classes);
  return [classNames copy];
}

+ (void)addClass:(Class)class
   isClassMethod:(BOOL)isClassMethod
{
  unsigned int methodsCount = 0;
  Method *methods = class_copyMethodList(class, &methodsCount);

  NSString *methodType = isClassMethod ? @"+" : @"-";

  for (unsigned int i = 0; i < methodsCount; i++) {
    Method method = methods[i];

    if (method) {
      SEL selector = method_getName(method);

      IMP methodImplementation = class_getMethodImplementation(class, selector);
      NSString *methodAddress = [NSString stringWithFormat:@"0x%010lx", (unsigned long)methodImplementation];
      NSString *methodName = [NSString stringWithFormat:@"%@[%@ %@]",
                              methodType,
                              NSStringFromClass(class),
                              NSStringFromSelector(selector)];

      if (methodAddress && methodName) {
        [_methodMapping setObject:methodName forKey:methodAddress];
      }
    }
  }
  free(methods);
}

+ (NSArray<NSString *> *)symbolicateCallstack:(NSArray<NSString *> *)callstack
                                methodMapping:(NSDictionary<NSString *,id> *)methodMapping
{
  if (!callstack || !methodMapping) {
    return nil;
  }
  NSArray<NSString *> *sortedAllAddress = [methodMapping.allKeys sortedArrayUsingComparator:^NSComparisonResult(id _Nonnull obj1, id _Nonnull obj2) {
    return [obj1 compare:obj2];
  }];

  BOOL containsFBSDKFunction = NO;
  NSInteger nonSDKMethodCount = 0;
  NSMutableArray<NSString *> *symbolicatedCallstack = [NSMutableArray array];

  for (NSUInteger i = 0; i < callstack.count; i++){
    NSString *rawAddress = [self getAddress:callstack[i]];
    NSString *addressString = [NSString stringWithFormat:@"0x%@",[rawAddress substringWithRange:NSMakeRange(rawAddress.length - 10, 10)]];
    NSString *methodAddress = [self searchMethod:addressString sortedAllAddress:sortedAllAddress];

    if (methodAddress) {
      containsFBSDKFunction = YES;
      nonSDKMethodCount == 0 ?: [symbolicatedCallstack addObject:[NSString stringWithFormat:@"(%ld DEV METHODS)", (long)nonSDKMethodCount]];
      nonSDKMethodCount = 0;
      NSString *methodName = [methodMapping objectForKey:methodAddress];
      [symbolicatedCallstack addObject:[NSString stringWithFormat:@"%@%@", methodName, [self getOffset:addressString secondString:methodAddress]]];
    } else {
      nonSDKMethodCount++;
    }
  }
  nonSDKMethodCount == 0 ?: [symbolicatedCallstack addObject:[NSString stringWithFormat:@"(%ld DEV METHODS)", (long)nonSDKMethodCount]];

  return containsFBSDKFunction ? symbolicatedCallstack : nil;
}

+ (NSString *)getAddress:(NSString *)callstackEntry
{
  NSArray<NSString *> *components = [callstackEntry componentsSeparatedByString:@" "];
  for (NSString *component in components) {
    if ([component containsString:@"0x"]) {
      return component;
    }
  }
  return nil;
}

+ (NSString *)getOffset:(NSString *)firstString
           secondString:(NSString *)secondString
{
  if (!firstString || !secondString) {
    return nil;
  }
  unsigned long long first = 0, second = 0;
  NSScanner *scanner = [NSScanner scannerWithString:firstString];
  [scanner scanHexLongLong:&first];

  scanner = [NSScanner scannerWithString:secondString];
  [scanner scanHexLongLong:&second];

  unsigned long long difference = first - second;
  return [NSString stringWithFormat:@"+%llu", difference];
}

+ (NSString *)searchMethod:(NSString *)address
          sortedAllAddress:(NSArray<NSString *> *)sortedAllAddress
{
  if (0 == sortedAllAddress.count) {
    return nil;
  }
  NSString *lowestAddress = sortedAllAddress[0];
  NSString *highestAddress = sortedAllAddress[sortedAllAddress.count - 1];

  if ([address compare:lowestAddress] == NSOrderedAscending || [address compare:highestAddress] == NSOrderedDescending) {
    return nil;
  }

  if ([address compare:lowestAddress] == NSOrderedSame) {
    return lowestAddress;
  }

  if ([address compare:highestAddress] == NSOrderedSame) {
    return highestAddress;
  }

  NSUInteger index = [sortedAllAddress indexOfObject:address
                                       inSortedRange:NSMakeRange(0, sortedAllAddress.count - 1)
                                             options:NSBinarySearchingInsertionIndex
                                     usingComparator:^NSComparisonResult(id  _Nonnull obj1, id  _Nonnull obj2) {
                                       return [obj1 compare:obj2];
                                     }];
  return sortedAllAddress[index - 1];
}

@end
