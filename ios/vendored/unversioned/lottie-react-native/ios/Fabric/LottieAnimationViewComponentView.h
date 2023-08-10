#ifdef __cplusplus
#import <React/RCTViewComponentView.h>
#import <react/renderer/components/lottiereactnative/Props.h>
#import "LottieContainerView.h"

NS_ASSUME_NONNULL_BEGIN

@interface LottieAnimationViewComponentView : RCTViewComponentView <LottieContainerViewDelegate>
@end

namespace facebook {
    namespace react {
        // In order to compare these structs we need to add the == operator for each
        // TODO: https://github.com/reactwg/react-native-new-architecture/discussions/91#discussioncomment-4426469
        bool operator==(const LottieAnimationViewColorFiltersStruct& a, const LottieAnimationViewColorFiltersStruct& b)
        {
            return b.keypath == a.keypath && b.color == a.color;
        }

        bool operator==(const LottieAnimationViewTextFiltersIOSStruct& a, const LottieAnimationViewTextFiltersIOSStruct& b)
        {
            return b.keypath == a.keypath && b.text == a.text;
        }
    }
}

NS_ASSUME_NONNULL_END

#endif
