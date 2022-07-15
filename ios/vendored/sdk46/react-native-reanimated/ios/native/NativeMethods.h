#import <Foundation/Foundation.h>
#import <ABI46_0_0RNReanimated/ABI46_0_0RNGestureHandlerStateManager.h>
#import <ABI46_0_0React/ABI46_0_0RCTUIManager.h>
#include <string>
#include <utility>
#include <vector>

namespace ABI46_0_0reanimated {

std::vector<std::pair<std::string, double>> measure(
    int viewTag,
    ABI46_0_0RCTUIManager *uiManager);
void scrollTo(
    int scrollViewTag,
    ABI46_0_0RCTUIManager *uiManager,
    double x,
    double y,
    bool animated);
void setGestureState(
    id<ABI46_0_0RNGestureHandlerStateManager> gestureHandlerStateManager,
    int handlerTag,
    int newState);

} // namespace reanimated
