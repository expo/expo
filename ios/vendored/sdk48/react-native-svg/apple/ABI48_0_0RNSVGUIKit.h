// Most (if not all) of this file could probably go away once react-native-macos's version of ABI48_0_0RCTUIKit.h makes its way
// upstream. https://github.com/microsoft/react-native-macos/issues/242

#if !TARGET_OS_OSX

#import <UIKit/UIKit.h>

#define ABI48_0_0RNSVGColor UIColor
#define ABI48_0_0RNSVGPlatformView UIView
#define ABI48_0_0RNSVGTextView UILabel
#define ABI48_0_0RNSVGView UIView

#else // TARGET_OS_OSX [

// Due to name mangling, calling c-style functions from .mm files will fail, therefore we need to wrap them with extern
// "C" so they are handled correctly. We also need to have imports positioned in a correct way, so that this extern "C"
// wrapper is used before the functions from ABI48_0_0RCTUIKit are used.
#ifdef __cplusplus
extern "C" {
#endif

#import <ABI48_0_0React/ABI48_0_0RCTUIKit.h>

#ifdef __cplusplus
}
#endif

#define ABI48_0_0RNSVGColor NSColor
#define ABI48_0_0RNSVGPlatformView NSView
#define ABI48_0_0RNSVGTextView NSTextView

@interface ABI48_0_0RNSVGView : ABI48_0_0RCTUIView

@property CGPoint center;
@property (nonatomic, strong) ABI48_0_0RNSVGColor *tintColor;

@end

// TODO: These could probably be a part of react-native-macos
// See https://github.com/microsoft/react-native-macos/issues/658 and
// https://github.com/microsoft/react-native-macos/issues/659
@interface NSImage (ABI48_0_0RNSVGMacOSExtensions)
@property (readonly) CGImageRef CGImage;
@end

@interface NSValue (ABI48_0_0RNSVGMacOSExtensions)
+ (NSValue *)valueWithCGAffineTransform:(CGAffineTransform)transform;
+ (NSValue *)valueWithCGPoint:(CGPoint)point;

@property (readonly) CGAffineTransform CGAffineTransformValue;
@property (readonly) CGPoint CGPointValue;
@end

#endif // ] TARGET_OS_OSX
