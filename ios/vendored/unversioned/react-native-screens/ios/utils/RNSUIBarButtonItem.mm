#import "./RNSUIBarButtonItem.h"

@implementation RNSUIBarButtonItem

- (void)setMenuHidden:(BOOL)menuHidden
{
  _menuHidden = menuHidden;
}

#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && defined(__IPHONE_14_0) && \
    __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_14_0
- (void)setMenu:(UIMenu *)menu
{
  if (@available(iOS 14.0, *)) {
    if (!_menuHidden) {
      super.menu = menu;
    }
  }
}
#endif

@end
