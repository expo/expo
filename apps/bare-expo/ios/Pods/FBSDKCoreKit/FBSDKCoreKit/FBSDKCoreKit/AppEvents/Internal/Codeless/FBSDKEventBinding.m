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

#import "TargetConditionals.h"

#if !TARGET_OS_TV

 #import "FBSDKEventBinding.h"

 #import "FBSDKAppEvents.h"
 #import "FBSDKAppEventsUtility.h"
 #import "FBSDKCodelessParameterComponent.h"
 #import "FBSDKCodelessPathComponent.h"
 #import "FBSDKInternalUtility.h"
 #import "FBSDKSwizzler.h"
 #import "FBSDKUtility.h"
 #import "FBSDKViewHierarchy.h"
 #import "FBSDKViewHierarchyMacros.h"

 #define CODELESS_PATH_TYPE_ABSOLUTE  @"absolute"
 #define CODELESS_PATH_TYPE_RELATIVE  @"relative"
 #define CODELESS_CODELESS_EVENT_KEY  @"_is_fb_codeless"
 #define PARAMETER_NAME_PRICE          @"_valueToSum"

@implementation FBSDKEventBinding

- (FBSDKEventBinding *)initWithJSON:(NSDictionary *)dict
{
  if ((self = [super init])) {
    _eventName = [dict[CODELESS_MAPPING_EVENT_NAME_KEY] copy];
    _eventType = [dict[CODELESS_MAPPING_EVENT_TYPE_KEY] copy];
    _appVersion = [dict[CODELESS_MAPPING_APP_VERSION_KEY] copy];
    _pathType = [dict[CODELESS_MAPPING_PATH_TYPE_KEY] copy];

    NSArray *pathComponents = dict[CODELESS_MAPPING_PATH_KEY];
    NSMutableArray *mut = [NSMutableArray array];
    for (NSDictionary *info in pathComponents) {
      FBSDKCodelessPathComponent *component = [[FBSDKCodelessPathComponent alloc] initWithJSON:info];
      [FBSDKTypeUtility array:mut addObject:component];
    }
    _path = [mut copy];

    NSArray *parameters = dict[CODELESS_MAPPING_PARAMETERS_KEY];
    mut = [NSMutableArray array];
    for (NSDictionary *info in parameters) {
      FBSDKCodelessParameterComponent *component = [[FBSDKCodelessParameterComponent alloc] initWithJSON:info];
      [FBSDKTypeUtility array:mut addObject:component];
    }
    _parameters = [mut copy];
  }
  return self;
}

- (void)trackEvent:(id)sender
{
  UIView *sourceView = [sender isKindOfClass:[UIView class]] ? (UIView *)sender : nil;
  NSMutableDictionary *params = [NSMutableDictionary dictionary];
  [FBSDKTypeUtility dictionary:params setObject:@"1" forKey:CODELESS_CODELESS_EVENT_KEY];
  for (FBSDKCodelessParameterComponent *component in self.parameters) {
    NSString *text = component.value;
    if (!text || text.length == 0) {
      text = [FBSDKEventBinding findParameterOfPath:component.path
                                           pathType:component.pathType
                                         sourceView:sourceView];
    }
    if (text.length > 0) {
      if ([component.name isEqualToString:PARAMETER_NAME_PRICE]) {
        NSNumber *value = [FBSDKAppEventsUtility getNumberValue:text];
        [FBSDKTypeUtility dictionary:params setObject:value forKey:component.name];
      } else {
        [FBSDKTypeUtility dictionary:params setObject:text forKey:component.name];
      }
    }
  }

  [FBSDKAppEvents logEvent:_eventName parameters:[params copy]];
}

+ (BOOL)matchAnyView:(NSArray *)views
       pathComponent:(FBSDKCodelessPathComponent *)component
{
  for (NSObject *view in views) {
    if ([self match:view pathComponent:component]) {
      return YES;
    }
  }
  return NO;
}

+ (BOOL)  match:(NSObject *)view
  pathComponent:(FBSDKCodelessPathComponent *)component
{
  NSString *className = NSStringFromClass([view class]);
  if (![className isEqualToString:component.className]) {
    return NO;
  }

  if (component.index >= 0) {
    NSObject *parent = [FBSDKViewHierarchy getParent:view];
    if (parent) {
      NSArray *children = [FBSDKViewHierarchy getChildren:[FBSDKViewHierarchy getParent:view]];
      NSUInteger index = [children indexOfObject:view];
      if (index == NSNotFound || index != component.index) {
        return NO;
      }
    } else {
      if (0 != component.index) {
        return NO;
      }
    }
  }

  if ((component.matchBitmask & FBSDKCodelessMatchBitmaskFieldText) > 0) {
    NSString *text = [FBSDKViewHierarchy getText:view];
    BOOL match = ((text.length == 0 && component.text.length == 0)
      || [text isEqualToString:component.text]);
    if (!match) {
      return NO;
    }
  }

  if ((component.matchBitmask & FBSDKCodelessMatchBitmaskFieldTag) > 0
      && [view isKindOfClass:[UIView class]]
      && component.tag != ((UIView *)view).tag) {
    return NO;
  }

  if ((component.matchBitmask & FBSDKCodelessMatchBitmaskFieldHint) > 0) {
    NSString *hint = [FBSDKViewHierarchy getHint:view];
    BOOL match = ((hint.length == 0 && component.hint.length == 0)
      || [hint isEqualToString:component.hint]);
    if (!match) {
      return NO;
    }
  }

  return YES;
}

+ (BOOL)isViewMatchPath:(UIView *)view path:(NSArray *)path
{
  NSArray *viewPath = [FBSDKViewHierarchy getPath:view];
  BOOL isMatch = [self isPath:path matchViewPath:viewPath];

  return isMatch;
}

+ (BOOL)isPath:(NSArray *)path matchViewPath:(NSArray *)viewPath
{
  for (NSInteger i = 0; i < MIN(path.count, viewPath.count); i++) {
    NSInteger idxPath = path.count - i - 1;
    NSInteger idxViewPath = viewPath.count - i - 1;

    FBSDKCodelessPathComponent *pathComponent = [FBSDKTypeUtility array:path objectAtIndex:idxPath];
    FBSDKCodelessPathComponent *viewPathComponent = [FBSDKTypeUtility array:viewPath objectAtIndex:idxViewPath];

    if (![pathComponent.className isEqualToString:viewPathComponent.className]) {
      return NO;
    }

    if (pathComponent.index >= 0
        && pathComponent.index != viewPathComponent.index) {
      return NO;
    }

    if ((pathComponent.matchBitmask & FBSDKCodelessMatchBitmaskFieldText) > 0) {
      NSString *text = viewPathComponent.text;
      BOOL match = ((text.length == 0 && pathComponent.text.length == 0)
        || [text isEqualToString:pathComponent.text]
        || [[FBSDKUtility SHA256Hash:text] isEqualToString:pathComponent.text]);
      if (!match) {
        return NO;
      }
    }

    if ((pathComponent.matchBitmask & FBSDKCodelessMatchBitmaskFieldTag) > 0
        && pathComponent.tag != viewPathComponent.tag) {
      return NO;
    }

    if ((pathComponent.matchBitmask & FBSDKCodelessMatchBitmaskFieldHint) > 0) {
      NSString *hint = viewPathComponent.hint;
      BOOL match = ((hint.length == 0 && pathComponent.hint.length == 0)
        || [hint isEqualToString:pathComponent.hint]
        || [[FBSDKUtility SHA256Hash:hint] isEqualToString:pathComponent.hint]);
      if (!match) {
        return NO;
      }
    }
  }

  return YES;
}

+ (NSObject *)findViewByPath:(NSArray *)path parent:(NSObject *)parent level:(int)level
{
  if (level >= path.count) {
    return nil;
  }

  FBSDKCodelessPathComponent *pathComponent = [FBSDKTypeUtility array:path objectAtIndex:level];

  // If found parent, skip to next level
  if ([pathComponent.className isEqualToString:CODELESS_MAPPING_PARENT_CLASS_NAME]) {
    NSObject *nextParent = [FBSDKViewHierarchy getParent:parent];

    return [FBSDKEventBinding findViewByPath:path parent:nextParent level:level + 1];
  } else if ([pathComponent.className isEqualToString:CODELESS_MAPPING_CURRENT_CLASS_NAME]) {
    return parent;
  }

  NSArray *children;
  if (parent) {
    children = [FBSDKViewHierarchy getChildren:parent];
  } else {
    UIWindow *window = [UIApplication sharedApplication].delegate.window;
    if (window) {
      children = @[window];
    } else {
      return nil;
    }
  }

  if (path.count - 1 == level) {
    int index = pathComponent.index;
    if (index >= 0) {
      NSObject *child = index < children.count ? [FBSDKTypeUtility array:children objectAtIndex:index] : nil;
      if ([self match:child pathComponent:pathComponent]) {
        return child;
      }
    } else {
      for (NSObject *child in children) {
        if ([self match:child pathComponent:pathComponent]) {
          return child;
        }
      }
    }
  } else {
    for (NSObject *child in children) {
      NSObject *result = [self findViewByPath:path parent:child level:level + 1];
      if (result) {
        return result;
      }
    }
  }

  return nil;
}

- (BOOL)isEqualToBinding:(FBSDKEventBinding *)binding
{
  if (_path.count != binding.path.count
      || _parameters.count != binding.parameters.count) {
    return NO;
  }

  NSString *current = [NSString stringWithFormat:@"%@|%@|%@|%@",
                       _eventName ?: @"",
                       _eventType ?: @"",
                       _appVersion ?: @"",
                       _pathType ?: @""];
  NSString *compared = [NSString stringWithFormat:@"%@|%@|%@|%@",
                        binding.eventName ?: @"",
                        binding.eventType ?: @"",
                        binding.appVersion ?: @"",
                        binding.pathType ?: @""];
  if (![current isEqualToString:compared]) {
    return NO;
  }

  for (int i = 0; i < _path.count; i++) {
    if (![[FBSDKTypeUtility array:_path objectAtIndex:i] isEqualToPath:[FBSDKTypeUtility array:binding.path objectAtIndex:i]]) {
      return NO;
    }
  }

  for (int i = 0; i < _parameters.count; i++) {
    if (![[FBSDKTypeUtility array:_parameters objectAtIndex:i] isEqualToParameter:[FBSDKTypeUtility array:binding.parameters objectAtIndex:i]]) {
      return NO;
    }
  }

  return YES;
}

// MARK: - find event parameters via relative path
+ (NSString *)findParameterOfPath:(NSArray *)path
                         pathType:(NSString *)pathType
                       sourceView:(UIView *)sourceView
{
  if (0 == path.count) {
    return nil;
  }

  UIView *rootView = sourceView;
  if (![pathType isEqualToString:CODELESS_PATH_TYPE_RELATIVE]) {
    rootView = nil;
  }

  NSObject *foundObj = [self findViewByPath:path parent:rootView level:0];

  return [FBSDKViewHierarchy getText:foundObj];
}

@end

#endif
