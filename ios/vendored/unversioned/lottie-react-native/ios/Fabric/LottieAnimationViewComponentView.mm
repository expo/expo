#import "LottieAnimationViewComponentView.h"

#import <react/renderer/components/lottiereactnative/ComponentDescriptors.h>
#import <react/renderer/components/lottiereactnative/EventEmitters.h>
#import <react/renderer/components/lottiereactnative/Props.h>
#import <react/renderer/components/lottiereactnative/RCTComponentViewHelpers.h>

#import "RCTFabricComponentsPlugins.h"
#import <React/RCTView.h>
#import "LottieContainerView.h"
#import "RNLottieFabricConversions.h"

using namespace facebook::react;

@interface LottieAnimationViewComponentView () <RCTLottieAnimationViewViewProtocol>
@end

@implementation LottieAnimationViewComponentView {
    LottieContainerView *_view;
}

+(void) load {
    [super load];
}

- (instancetype) initWithFrame:(CGRect)frame
{
    if (self = [super initWithFrame:frame]) {
        static const auto defaultProps = std::make_shared<const LottieAnimationViewProps>();
        _props = defaultProps;

        _view = [LottieContainerView new];
        _view.delegate = self;

        self.contentView = _view;
    }

    return self;
}

#pragma mark - RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
    return concreteComponentDescriptorProvider<LottieAnimationViewComponentDescriptor>();
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps {
    const auto &oldLottieProps = *std::static_pointer_cast<const LottieAnimationViewProps>(_props);
    const auto &newLottieProps = *std::static_pointer_cast<const LottieAnimationViewProps>(props);

    if(oldLottieProps.resizeMode != newLottieProps.resizeMode) {
        [_view setResizeMode:RCTNSStringFromString(newLottieProps.resizeMode)];
    }

    if(oldLottieProps.sourceJson != newLottieProps.sourceJson) {
        [_view setSourceJson:RCTNSStringFromString(newLottieProps.sourceJson.c_str())];
    }

    if(oldLottieProps.sourceDotLottieURI != newLottieProps.sourceDotLottieURI) {
        [_view setSourceDotLottieURI:RCTNSStringFromString(newLottieProps.sourceDotLottieURI)];
    }

    if(oldLottieProps.sourceName != newLottieProps.sourceName) {
        [_view setSourceName:RCTNSStringFromString(newLottieProps.sourceName)];
    }

    if(oldLottieProps.sourceURL != newLottieProps.sourceURL) {
        [_view setSourceURL:RCTNSStringFromString(newLottieProps.sourceURL)];
    }

    if(oldLottieProps.progress != newLottieProps.progress) {
        [_view setProgress:newLottieProps.progress];
    }

    if(oldLottieProps.loop != newLottieProps.loop) {
        [_view setLoop:newLottieProps.loop];
    }

    if(oldLottieProps.speed != newLottieProps.speed) {
        [_view setSpeed:newLottieProps.speed];
    }

    if(oldLottieProps.colorFilters != newLottieProps.colorFilters) {
        [_view setColorFilters:convertColorFilters(newLottieProps.colorFilters)];
    }

    if(oldLottieProps.textFiltersIOS != newLottieProps.textFiltersIOS) {
        [_view setTextFiltersIOS:convertTextFilters(newLottieProps.textFiltersIOS)];
    }

    if(oldLottieProps.renderMode != newLottieProps.renderMode) {
        [_view setRenderMode:RCTNSStringFromString(newLottieProps.renderMode)];
    }

    if(oldLottieProps.autoPlay != newLottieProps.autoPlay) {
        [_view setAutoPlay:newLottieProps.autoPlay];
    }

    [super updateProps:props oldProps:oldProps];
}

#pragma mark - Native Commands

- (void)handleCommand:(const NSString *)commandName args:(const NSArray *)args
{
    RCTLottieAnimationViewHandleCommand(self, commandName, args);
}

- (void) play:(NSInteger)startFrame endFrame:(NSInteger)endFrame
{
    if (startFrame != -1 && endFrame != -1) {
        [_view playFromFrame:@(startFrame) toFrame:endFrame];
    } else {
        [_view play];
    }
}

- (void) reset
{
    [_view reset];
}

- (void) pause
{
    [_view pause];
}

- (void) resume
{
    [_view resume];
}

- (void)onAnimationFinishWithIsCancelled:(bool)isCancelled
{
    if(!_eventEmitter) {
        return;
    }

    LottieAnimationViewEventEmitter::OnAnimationFinish event = {
        .isCancelled = isCancelled
    };

    std::dynamic_pointer_cast<const LottieAnimationViewEventEmitter>(_eventEmitter)->onAnimationFinish(event);
}

- (void)onAnimationFailureWithError:(NSString*)error
{
    if(!_eventEmitter) {
        return;
    }

    LottieAnimationViewEventEmitter::OnAnimationFailure event = {
        .error = std::string([error UTF8String])
    };

    std::dynamic_pointer_cast<const LottieAnimationViewEventEmitter>(_eventEmitter)->onAnimationFailure(event);
}

- (void)onAnimationLoaded
{
    if(!_eventEmitter) {
        return;
    }

    LottieAnimationViewEventEmitter::OnAnimationLoaded event = {};

    std::dynamic_pointer_cast<const LottieAnimationViewEventEmitter>(_eventEmitter)->onAnimationLoaded(event);
}

@end

Class<RCTComponentViewProtocol> LottieAnimationViewCls(void)
{
    return LottieAnimationViewComponentView.class;
}
