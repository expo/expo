// This guard prevent this file to be compiled in the old architecture.
#ifdef RCT_NEW_ARCH_ENABLED
#import <React/RCTViewComponentView.h>
#import <React/RCTConversions.h>
#import <WebKit/WKDataDetectorTypes.h>
#import <UIKit/UIKit.h>
#import <react/renderer/components/RNCWebViewSpec/Props.h>

#ifndef NativeComponentExampleComponentView_h
#define NativeComponentExampleComponentView_h

NS_ASSUME_NONNULL_BEGIN

@interface RNCWebView : RCTViewComponentView
@end

namespace facebook {
namespace react {
    bool operator==(const RNCWebViewMenuItemsStruct& a, const RNCWebViewMenuItemsStruct& b)
    {
        return b.key == a.key && b.label == a.label;
    }
}
}

NS_ASSUME_NONNULL_END

#endif /* NativeComponentExampleComponentView_h */
#endif /* RCT_NEW_ARCH_ENABLED */
