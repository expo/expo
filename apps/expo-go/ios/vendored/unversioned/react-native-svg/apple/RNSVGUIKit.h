// Most (if not all) of this file could probably go away once react-native-macos's version of RCTUIKit.h makes its way
// upstream. https://github.com/microsoft/react-native-macos/issues/242

#if !TARGET_OS_OSX

#import <UIKit/UIKit.h>

#define RNSVGColor UIColor
#define RNSVGPlatformView UIView
#define RNSVGTextView UILabel
#define RNSVGView UIView

#else // TARGET_OS_OSX [

// Due to name mangling, calling c-style functions from .mm files will fail, therefore we need to wrap them with extern
// "C" so they are handled correctly. We also need to have imports positioned in a correct way, so that this extern "C"
// wrapper is used before the functions from RCTUIKit are used.
#ifdef __cplusplus
extern "C" {
#endif

#import <React/RCTUIKit.h>

#ifdef __cplusplus
}
#endif

#define RNSVGColor NSColor
#define RNSVGPlatformView NSView
#define RNSVGTextView NSTextView

@interface RNSVGView : RCTUIView

@property CGPoint center;
@property (nonatomic, strong) RNSVGColor *tintColor;

@end

// TODO: These could probably be a part of react-native-macos
// See https://github.com/microsoft/react-native-macos/issues/658 and
// https://github.com/microsoft/react-native-macos/issues/659
@interface NSImage (RNSVGMacOSExtensions)
@property (readonly) CGImageRef CGImage;
@end

@interface NSValue (RNSVGMacOSExtensions)
+ (NSValue *)valueWithCGAffineTransform:(CGAffineTransform)transform;
+ (NSValue *)valueWithCGPoint:(CGPoint)point;

@property (readonly) CGAffineTransform CGAffineTransformValue;
@property (readonly) CGPoint CGPointValue;
@end

#endif // ] TARGET_OS_OSX
