// Copyright 2025-present 650 Industries. All rights reserved.

#import <ExpoModulesJSI/EXJavaScriptObjectBinding.h>
#import <ExpoModulesJSI/EXJSIConversions.h>

/**
  A wrapper around `EXJavaScriptObject`'s getter. The getter is a Swift lambda that creates the JS object.
  Needed to make sure the object creation happens on the correct thread when called from inside `EXJSIConversions`.
 */
@implementation EXJavaScriptObjectBinding

- (nonnull instancetype)initWithGetter:(EXJavaScriptObjectBindingGetter)getter
{
  self.getter = getter;
  return self;
}

- (EXJavaScriptObject *)get
{
  auto obj = self.getter();
  return obj;
}

@end
