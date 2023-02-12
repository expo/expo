#import <Foundation/Foundation.h>
#import <ABI48_0_0RNReanimated/ABI48_0_0RNGestureHandlerStateManager.h>
#import <ABI48_0_0React/ABI48_0_0RCTUIManager.h>
#include <string>
#include <utility>
#include <vector>

namespace ABI48_0_0reanimated {

std::vector<std::pair<std::string, double>> measure(
    int viewTag,
    ABI48_0_0RCTUIManager *uiManager);
void scrollTo(
    int scrollViewTag,
    ABI48_0_0RCTUIManager *uiManager,
    double x,
    double y,
    bool animated);
void setGestureState(
    id<ABI48_0_0RNGestureHandlerStateManager> gestureHandlerStateManager,
    int handlerTag,
    int newState);

} // namespace reanimated
