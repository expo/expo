#import <Foundation/Foundation.h>
#import <ABI44_0_0React/ABI44_0_0RCTUIManager.h>
#include <string>
#import <string>
#include <utility>
#include <vector>
#import <vector>
#import "ABI44_0_0RNGestureHandlerStateManager.h"

namespace ABI44_0_0reanimated {

std::vector<std::pair<std::string, double>> measure(
    int viewTag,
    ABI44_0_0RCTUIManager *uiManager);
void scrollTo(
    int scrollViewTag,
    ABI44_0_0RCTUIManager *uiManager,
    double x,
    double y,
    bool animated);
void setGestureState(
    id<ABI44_0_0RNGestureHandlerStateManager> gestureHandlerStateManager,
    int handlerTag,
    int newState);

} // namespace reanimated
