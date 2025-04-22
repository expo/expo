// Copyright 2025-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXJSIConversions.h>
#import <ExpoModulesCore/EXJavaScriptSharedObjectBinding.h>

@implementation EXJavaScriptSharedObjectBinding

- (nonnull instancetype)initWithGetter:(EXJavaScriptObjectBindingGetter) getter
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
