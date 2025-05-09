// Copyright 2025-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXJSIConversions.h>
#import <ExpoModulesCore/EXJavaScriptSharedObjectBinding.h>

/**
  A wrapper around a SharedObject getter – The getter is a Swift lambda that creates the JS object and registers the pair in registry.
  Needed to make sure the registration happens on the correct thread when called from inside EXJSIConversions.
 */
@implementation EXJavaScriptSharedObjectBinding

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
