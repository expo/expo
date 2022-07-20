// Copyright 2022-present 650 Industries. All rights reserved.

#import <react/renderer/componentregistry/ComponentDescriptorProvider.h>

#import <ExpoModulesCore/EXJSIConversions.h>
#import <ExpoModulesCore/ExpoFabricEnabledBaseView.h>
#import <ExpoModulesCore/ExpoViewComponentDescriptor.h>
#import <ExpoModulesCore/Swift.h>

using namespace expo;

@implementation ExpoFabricEnabledBaseView

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const expo::ExpoViewProps>();
    _props = defaultProps;

    self.contentView = [[UIView alloc] initWithFrame:CGRectZero];
  }
  return self;
}

#pragma mark - RCTComponentViewProtocol

+ (facebook::react::ComponentDescriptorProvider)componentDescriptorProvider
{
  return facebook::react::ComponentDescriptorProvider {
    expo::ExpoViewComponentDescriptor::ConcreteShadowNode::Handle(),
    expo::ExpoViewComponentDescriptor::ConcreteShadowNode::Name(),
    nullptr,
    &facebook::react::concreteComponentDescriptorConstructor<expo::ExpoViewComponentDescriptor>
  };
}

- (void)updateProps:(const facebook::react::Props::Shared &)props oldProps:(const facebook::react::Props::Shared &)oldProps
{
  const auto &newViewProps = *std::static_pointer_cast<ExpoViewProps const>(props);

  EXJavaScriptRuntime *runtime = [[self __injectedAppContext] runtime];
  jsi::Runtime *jsiRuntime = [runtime get];

  const jsi::Value &rawProps = newViewProps.getValue();

  if (rawProps.isObject()) {
    jsi::Object obj = rawProps.asObject(*jsiRuntime);
    jsi::Value proxiedProps = obj.getProperty(*jsiRuntime, "proxiedProperties");

    if (proxiedProps.isObject()) {
      NSDictionary *obj = convertJSIValueToObjCObject(*jsiRuntime, proxiedProps, nullptr);

      NSLog(@"%@", obj);
    }
  }

  [super updateProps:props oldProps:oldProps];
}

#pragma mark - Methods to override in the class copy

- (nullable EXAppContext *)__injectedAppContext
{
  [NSException raise:@"UninjectedException" format:@"The AppContext must be injected in the copy of 'ExpoFabricView' class"];
  return nil;
}

- (nonnull NSString *)__injectedModuleName
{
  [NSException raise:@"UninjectedException" format:@"The module name must be injected in the copy of 'ExpoFabricView' class"];
  return nil;
}

@end
