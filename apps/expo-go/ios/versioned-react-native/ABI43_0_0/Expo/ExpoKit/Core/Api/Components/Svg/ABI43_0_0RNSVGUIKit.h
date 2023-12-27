// Most (if not all) of this file could probably go away once ABI43_0_0React-native-macos's version of ABI43_0_0RCTUIKit.h makes its way upstream.
// https://github.com/microsoft/ABI43_0_0React-native-macos/issues/242

#if !TARGET_OS_OSX

#import <UIKit/UIKit.h>

#define ABI43_0_0RNSVGColor UIColor
#define ABI43_0_0RNSVGPlatformView UIView
#define ABI43_0_0RNSVGTextView UILabel
#define ABI43_0_0RNSVGView UIView

#else // TARGET_OS_OSX [

#import <ABI43_0_0React/ABI43_0_0RCTUIKit.h>

#define ABI43_0_0RNSVGColor NSColor
#define ABI43_0_0RNSVGPlatformView NSView
#define ABI43_0_0RNSVGTextView NSTextView

@interface ABI43_0_0RNSVGView : ABI43_0_0RCTUIView

@property CGPoint center;
@property (nonatomic, strong) ABI43_0_0RNSVGColor *tintColor;

@end

// TODO: These could probably be a part of ABI43_0_0React-native-macos
// See https://github.com/microsoft/ABI43_0_0React-native-macos/issues/658 and https://github.com/microsoft/ABI43_0_0React-native-macos/issues/659
@interface NSImage (ABI43_0_0RNSVGMacOSExtensions)
@property (readonly) CGImageRef CGImage;
@end

@interface NSValue (ABI43_0_0RNSVGMacOSExtensions)
+ (NSValue *)valueWithCGAffineTransform:(CGAffineTransform)transform;
+ (NSValue *)valueWithCGPoint:(CGPoint)point;

@property (readonly) CGAffineTransform CGAffineTransformValue;
@property (readonly) CGPoint CGPointValue;
@end

#endif // ] TARGET_OS_OSX
