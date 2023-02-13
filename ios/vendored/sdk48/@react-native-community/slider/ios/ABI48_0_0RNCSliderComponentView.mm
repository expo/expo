#ifdef ABI48_0_0RCT_NEW_ARCH_ENABLED

#import "ABI48_0_0RNCSliderComponentView.h"

#import <ABI48_0_0React/ABI48_0_0RCTConversions.h>

#import <react/renderer/components/ABI48_0_0RNCSlider/ComponentDescriptors.h>
#import <react/renderer/components/ABI48_0_0RNCSlider/EventEmitters.h>
#import <react/renderer/components/ABI48_0_0RNCSlider/Props.h>
#import <react/renderer/components/ABI48_0_0RNCSlider/ABI48_0_0RCTComponentViewHelpers.h>
#import <ABI48_0_0React/ABI48_0_0RCTBridge+Private.h>
#import "ABI48_0_0RCTImagePrimitivesConversions.h"
#import <ABI48_0_0React/ABI48_0_0RCTImageLoaderProtocol.h>
#import "ABI48_0_0RCTFabricComponentsPlugins.h"
#import "ABI48_0_0RNCSlider.h"

using namespace ABI48_0_0facebook::ABI48_0_0React;

@interface ABI48_0_0RNCSliderComponentView () <ABI48_0_0RCTRNCSliderViewProtocol>

@end


@implementation ABI48_0_0RNCSliderComponentView
{
    ABI48_0_0RNCSlider *slider;
    UIImage *_image;
    BOOL _isSliding;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
    return concreteComponentDescriptorProvider<ABI48_0_0RNCSliderComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame
{
    if (self = [super initWithFrame:frame]) {
        static const auto defaultProps = std::make_shared<const ABI48_0_0RNCSliderProps>();
        _props = defaultProps;
        slider = [[ABI48_0_0RNCSlider alloc] initWithFrame:self.bounds];
        [slider addTarget:self action:@selector(sliderValueChanged:)
         forControlEvents:UIControlEventValueChanged];
        [slider addTarget:self action:@selector(sliderTouchStart:)
         forControlEvents:UIControlEventTouchDown];
        [slider addTarget:self action:@selector(sliderTouchEnd:)
         forControlEvents:(UIControlEventTouchUpInside |
                           UIControlEventTouchUpOutside |
                           UIControlEventTouchCancel)];
        
        UITapGestureRecognizer *tapGesturer;
        tapGesturer = [[UITapGestureRecognizer alloc] initWithTarget: self action:@selector(tapHandler:)];
        [tapGesturer setNumberOfTapsRequired: 1];
        [slider addGestureRecognizer:tapGesturer];
        
        slider.value = (float)defaultProps->value;
        self.contentView = slider;
    }
    return self;
}

- (void)tapHandler:(UITapGestureRecognizer *)gesture {
    if ([gesture.view class] != [ABI48_0_0RNCSlider class]) {
        return;
    }
    ABI48_0_0RNCSlider *slider = (ABI48_0_0RNCSlider *)gesture.view;
    slider.isSliding = _isSliding;
    
    // Ignore this tap if in the middle of a slide.
    if (_isSliding) {
        return;
    }
    
    if (!slider.tapToSeek) {
        return;
    }
    
    CGPoint touchPoint = [gesture locationInView:slider];
    float rangeWidth = slider.maximumValue - slider.minimumValue;
    float sliderPercent = touchPoint.x / slider.bounds.size.width;
    slider.lastValue = slider.value;
    float value = slider.minimumValue + (rangeWidth * sliderPercent);
    
    [slider setValue:[slider discreteValue:value] animated: YES];
    
    std::dynamic_pointer_cast<const ABI48_0_0RNCSliderEventEmitter>(_eventEmitter)
    ->onRNCSliderSlidingStart(ABI48_0_0RNCSliderEventEmitter::OnRNCSliderSlidingStart{.value = static_cast<Float>(slider.lastValue)});
    
    // Trigger onValueChange to address https://github.com/react-native-community/react-native-slider/issues/212
    std::dynamic_pointer_cast<const ABI48_0_0RNCSliderEventEmitter>(_eventEmitter)
    ->onRNCSliderValueChange(ABI48_0_0RNCSliderEventEmitter::OnRNCSliderValueChange{.value = static_cast<Float>(slider.value)});
    
    std::dynamic_pointer_cast<const ABI48_0_0RNCSliderEventEmitter>(_eventEmitter)
    ->onRNCSliderSlidingComplete(ABI48_0_0RNCSliderEventEmitter::OnRNCSliderSlidingComplete{.value = static_cast<Float>(slider.value)});
}

- (void)sliderValueChanged:(ABI48_0_0RNCSlider *)sender
{
    [self ABI48_0_0RNCSendSliderEvent:sender withContinuous:YES isSlidingStart:NO];
}

- (void)sliderTouchStart:(ABI48_0_0RNCSlider *)sender
{
    [self ABI48_0_0RNCSendSliderEvent:sender withContinuous:NO isSlidingStart:YES];
    _isSliding = YES;
    sender.isSliding = YES;
}

- (void)sliderTouchEnd:(ABI48_0_0RNCSlider *)sender
{
    [self ABI48_0_0RNCSendSliderEvent:sender withContinuous:NO isSlidingStart:NO];
    sender.isSliding = NO;
    _isSliding = NO;
}

- (void)ABI48_0_0RNCSendSliderEvent:(ABI48_0_0RNCSlider *)sender withContinuous:(BOOL)continuous isSlidingStart:(BOOL)isSlidingStart
{
    float value = [sender discreteValue:sender.value];
    
    if (value < sender.lowerLimit) {
        value = sender.lowerLimit;
        [sender setValue:value animated:NO];
    } else if (value > sender.upperLimit) {
        value = sender.upperLimit;
        [sender setValue:value animated:NO];
    }

    if(!sender.isSliding) {
        [sender setValue:value animated:NO];
    }
    
    if (continuous) {
        if (sender.lastValue != value)  {
            std::dynamic_pointer_cast<const ABI48_0_0RNCSliderEventEmitter>(_eventEmitter)
            ->onRNCSliderValueChange(ABI48_0_0RNCSliderEventEmitter::OnRNCSliderValueChange{.value = static_cast<Float>(value)});
        }
    } else {
        if (!isSlidingStart) {
            std::dynamic_pointer_cast<const ABI48_0_0RNCSliderEventEmitter>(_eventEmitter)
            ->onRNCSliderSlidingComplete(ABI48_0_0RNCSliderEventEmitter::OnRNCSliderSlidingComplete{.value = static_cast<Float>(value)});
        }
        if (isSlidingStart) {
            std::dynamic_pointer_cast<const ABI48_0_0RNCSliderEventEmitter>(_eventEmitter)
            ->onRNCSliderSlidingStart(ABI48_0_0RNCSliderEventEmitter::OnRNCSliderSlidingStart{.value = static_cast<Float>(value)});
        }
    }
    
    sender.lastValue = value;
}

- (void)updateProps:(const Props::Shared &)props oldProps:(const Props::Shared &)oldProps
{
    const auto &oldScreenProps = *std::static_pointer_cast<const ABI48_0_0RNCSliderProps>(_props);
    const auto &newScreenProps = *std::static_pointer_cast<const ABI48_0_0RNCSliderProps>(props);
    
    if (oldScreenProps.value != newScreenProps.value) {
        if (!slider.isSliding) {
            slider.value = newScreenProps.value;
        }
    }
    if (oldScreenProps.disabled != newScreenProps.disabled) {
        [slider setDisabled: newScreenProps.disabled];
    }
    if (oldScreenProps.step != newScreenProps.step) {
        slider.step = newScreenProps.step;
    }
    if (oldScreenProps.inverted != newScreenProps.inverted) {
        [self setInverted:newScreenProps.inverted];
    }
    if (oldScreenProps.maximumValue != newScreenProps.maximumValue) {
        [slider setMaximumValue:newScreenProps.maximumValue];
    }
    if (oldScreenProps.lowerLimit != newScreenProps.lowerLimit) {
        slider.lowerLimit = newScreenProps.lowerLimit;
    }
    if (oldScreenProps.upperLimit != newScreenProps.upperLimit) {
        slider.upperLimit = newScreenProps.upperLimit;
    }
    if (oldScreenProps.tapToSeek != newScreenProps.tapToSeek) {
        slider.tapToSeek = newScreenProps.tapToSeek;
    }
    if (oldScreenProps.minimumValue != newScreenProps.minimumValue) {
        [slider setMinimumValue:newScreenProps.minimumValue];
    }
    if (oldScreenProps.thumbTintColor != newScreenProps.thumbTintColor) {
        slider.thumbTintColor = ABI48_0_0RCTUIColorFromSharedColor(newScreenProps.thumbTintColor);
    }
    if (oldScreenProps.minimumTrackTintColor != newScreenProps.minimumTrackTintColor) {
        slider.minimumTrackTintColor = ABI48_0_0RCTUIColorFromSharedColor(newScreenProps.minimumTrackTintColor);
    }
    if (oldScreenProps.maximumTrackTintColor != newScreenProps.maximumTrackTintColor) {
        slider.maximumTrackTintColor = ABI48_0_0RCTUIColorFromSharedColor(newScreenProps.maximumTrackTintColor);
    }
    if (oldScreenProps.accessibilityUnits != newScreenProps.accessibilityUnits) {
        NSString *convertedAccessibilityUnits = [NSString stringWithCString:newScreenProps.accessibilityUnits.c_str()
                                                                   encoding:[NSString defaultCStringEncoding]];
        slider.accessibilityUnits = convertedAccessibilityUnits;
    }
    if (oldScreenProps.accessibilityIncrements != newScreenProps.accessibilityIncrements) {
        id accessibilityIncrements = [NSArray new];
        for (auto str : newScreenProps.accessibilityIncrements) {
            [accessibilityIncrements addObject:[NSString stringWithUTF8String:str.c_str()]];
        }
        [slider setAccessibilityIncrements:accessibilityIncrements];
    }
    if (oldScreenProps.thumbImage != newScreenProps.thumbImage) {
        [self loadImageFromImageSource:newScreenProps.thumbImage completionBlock:^(NSError *error, UIImage *image) {
            dispatch_async(dispatch_get_main_queue(), ^{
                [self->slider setThumbImage:image];
            });
        }
        failureBlock:^{
            [self->slider setThumbImage:nil];
        }];
    }
    if (oldScreenProps.trackImage != newScreenProps.trackImage) {
        [self loadImageFromImageSource:newScreenProps.trackImage completionBlock:^(NSError *error, UIImage *image) {
            dispatch_async(dispatch_get_main_queue(), ^{
                [self->slider setTrackImage:image];
            });
        }
        failureBlock:^{
            [self->slider setTrackImage:nil];
        }];
    }
    if (oldScreenProps.minimumTrackImage != newScreenProps.minimumTrackImage) {
        [self loadImageFromImageSource:newScreenProps.minimumTrackImage completionBlock:^(NSError *error, UIImage *image) {
            dispatch_async(dispatch_get_main_queue(), ^{
                [self->slider setMinimumTrackImage:image];
            });
        }
        failureBlock:^{
            [self->slider setMinimumTrackImage:nil];
        }];
    }
    if (oldScreenProps.maximumTrackImage != newScreenProps.maximumTrackImage) {
        [self loadImageFromImageSource:newScreenProps.maximumTrackImage completionBlock:^(NSError *error, UIImage *image) {
            dispatch_async(dispatch_get_main_queue(), ^{
                [self->slider setMaximumTrackImage:image];
            });
        }
        failureBlock:^{
            [self->slider setMaximumTrackImage:nil];
        }];
    }
    [super updateProps:props oldProps:oldProps];
}


// TODO temporarily using bridge, workaround for https://github.com/reactwg/react-native-new-architecture/discussions/31#discussioncomment-2717047, rewrite when Meta comes with a solution.
- (void)loadImageFromImageSource:(ImageSource)source completionBlock:(ABI48_0_0RNCLoadImageCompletionBlock)completionBlock failureBlock:(ABI48_0_0RNCLoadImageFailureBlock)failureBlock
{
    NSString *uri = [[NSString alloc] initWithUTF8String:source.uri.c_str()];
    if ((BOOL)uri.length) {
        [[[ABI48_0_0RCTBridge currentBridge] moduleForName:@"ImageLoader"]
        loadImageWithURLRequest:NSURLRequestFromImageSource(source)
        size:CGSizeMake(source.size.width, source.size.height)
        scale:source.scale
        clipped:NO
        resizeMode:ABI48_0_0RCTResizeModeCover
        progressBlock:nil
        partialLoadBlock:nil
        completionBlock:completionBlock];
    } else {
        failureBlock();
    }
}

- (void)setInverted:(BOOL)inverted
{
    if (inverted) {
        self.transform = CGAffineTransformMakeScale(-1, 1);
    } else {
        self.transform = CGAffineTransformMakeScale(1, 1);
    }
}

@end

Class<ABI48_0_0RCTComponentViewProtocol> ABI48_0_0RNCSliderCls(void)
{
    return ABI48_0_0RNCSliderComponentView.class;
}

#endif
