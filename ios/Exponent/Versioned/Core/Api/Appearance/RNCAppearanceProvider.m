#import "RNCAppearanceProvider.h"

@implementation RNCAppearanceProvider

#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && defined(__IPHONE_13_0) && \
    __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_13_0
- (void)traitCollectionDidChange:(UITraitCollection *)previousTraitCollection
{
  [super traitCollectionDidChange:previousTraitCollection];

  if (@available(iOS 13.0, *)) {
    if ([previousTraitCollection hasDifferentColorAppearanceComparedToTraitCollection:self.traitCollection]) {
        // note(brentvatne):
        // When backgrounding the app, perhaps due to a bug on iOS 13 beta the
        // user interface style changes to the opposite color scheme and then back to
        // the current color scheme immediately afterwards. I'm not sure how to prevent
        // this so instead I debounce the notification calls by 10ms.
        [NSObject cancelPreviousPerformRequestsWithTarget:self selector: @selector(notifyUserInterfaceStyleChanged) object:nil];
        [self performSelector:@selector(notifyUserInterfaceStyleChanged) withObject:nil afterDelay:0.01];

    }
  }
}

- (void)notifyUserInterfaceStyleChanged
{
    [[NSNotificationCenter defaultCenter] postNotificationName:@"RNCUserInterfaceStyleDidChangeNotification"
                                                      object:self
                                                    userInfo:@{@"traitCollection": self.traitCollection}];
}
#endif

@end
