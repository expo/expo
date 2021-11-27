// Most (if not all) of this file could probably go away once react-native-macos's version of RCTUIKit.h makes its way upstream.
// https://github.com/microsoft/react-native-macos/issues/242

#if !TARGET_OS_OSX

#import <UIKit/UIKit.h>

#define DevLauncherRNSVGColor UIColor
#define DevLauncherRNSVGPlatformView UIView
#define DevLauncherRNSVGTextView UILabel
#define DevLauncherRNSVGView UIView

#else // TARGET_OS_OSX [

#import <React/RCTUIKit.h>

#define DevLauncherRNSVGColor NSColor
#define DevLauncherRNSVGPlatformView NSView
#define DevLauncherRNSVGTextView NSTextView

@interface DevLauncherRNSVGView : RCTUIView

@property CGPoint center;
@property (nonatomic, strong) DevLauncherRNSVGColor *tintColor;

@end

// TODO: These could probably be a part of react-native-macos
// See https://github.com/microsoft/react-native-macos/issues/658 and https://github.com/microsoft/react-native-macos/issues/659
@interface NSImage (DevLauncherRNSVGMacOSExtensions)
@property (readonly) CGImageRef CGImage;
@end

@interface NSValue (DevLauncherRNSVGMacOSExtensions)
+ (NSValue *)valueWithCGAffineTransform:(CGAffineTransform)transform;
+ (NSValue *)valueWithCGPoint:(CGPoint)point;

@property (readonly) CGAffineTransform CGAffineTransformValue;
@property (readonly) CGPoint CGPointValue;
@end

#endif // ] TARGET_OS_OSX
