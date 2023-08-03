#import <Foundation/Foundation.h>
#import <ABI49_0_0RNReanimated/ABI49_0_0RNGestureHandlerStateManager.h>
#import <ABI49_0_0React/ABI49_0_0RCTUIManager.h>
#include <string>
#include <utility>
#include <vector>

namespace ABI49_0_0reanimated {

std::vector<std::pair<std::string, double>> measure(
    int viewTag,
    ABI49_0_0RCTUIManager *uiManager);
void scrollTo(
    int scrollViewTag,
    ABI49_0_0RCTUIManager *uiManager,
    double x,
    double y,
    bool animated);
void setGestureState(
    id<ABI49_0_0RNGestureHandlerStateManager> gestureHandlerStateManager,
    int handlerTag,
    int newState);

} // namespace reanimated
