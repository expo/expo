#ifdef RCT_NEW_ARCH_ENABLED
#import <SkiaDomView.h>

#import <RNSkDomView.h>
#import <RNSkIOSView.h>
#import <RNSkPlatformContext.h>

#import <RNSkiaModule.h>
#import <SkiaManager.h>
#import <SkiaUIView.h>

#import <React/RCTBridge+Private.h>
#import <React/RCTConversions.h>
#import <React/RCTFabricComponentsPlugins.h>

#import <react/renderer/components/rnskia/ComponentDescriptors.h>
#import <react/renderer/components/rnskia/EventEmitters.h>
#import <react/renderer/components/rnskia/Props.h>
#import <react/renderer/components/rnskia/RCTComponentViewHelpers.h>

using namespace facebook::react;

@implementation SkiaDomView

- (instancetype)initWithFrame:(CGRect)frame {
  if (self = [super initWithFrame:frame]) {
    auto skManager = [[self skiaManager] skManager];
    // Pass SkManager as a raw pointer to avoid circular dependenciesr
    [self
        initCommon:skManager.get()
           factory:[](std::shared_ptr<RNSkia::RNSkPlatformContext> context) {
             return std::make_shared<RNSkiOSView<RNSkia::RNSkDomView>>(context);
           }];
    static const auto defaultProps = std::make_shared<const SkiaDomViewProps>();
    _props = defaultProps;
  }
  return self;
}

#pragma mark - RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider {
  return concreteComponentDescriptorProvider<SkiaDomViewComponentDescriptor>();
}

- (void)updateProps:(const Props::Shared &)props
           oldProps:(const Props::Shared &)oldProps {
  const auto &newProps =
      *std::static_pointer_cast<const SkiaDomViewProps>(props);
  [super updateProps:props oldProps:oldProps];
  int nativeId =
      [[RCTConvert NSString:RCTNSStringFromString(newProps.nativeId)] intValue];
  [self setNativeId:nativeId];
  [self setDrawingMode:newProps.mode];
  [self setDebugMode:newProps.debug];
}

@end

Class<RCTComponentViewProtocol> SkiaDomViewCls(void) {
  return SkiaDomView.class;
}

#endif // RCT_NEW_ARCH_ENABLED
