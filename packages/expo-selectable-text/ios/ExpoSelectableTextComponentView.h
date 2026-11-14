#import <React/RCTParagraphComponentView.h>

NS_ASSUME_NONNULL_BEGIN

/*
 * The private React Native methods that range selection depends on and that this
 * React Native version does not have. Empty when range selection can work.
 */
FOUNDATION_EXPORT NSArray<NSString *> *ExpoSelectableTextMissingReactNativeHooks(void);

/*
 * React Native's paragraph view under its own component name. React Native
 * still lays out, draws, hit-tests and exposes the text to accessibility. This
 * class adds range selection and custom selection menu items.
 */
@interface ExpoSelectableTextComponentView : RCTParagraphComponentView
@end

NS_ASSUME_NONNULL_END
