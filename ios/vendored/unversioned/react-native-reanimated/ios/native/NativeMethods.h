#import <Foundation/Foundation.h>
#import <RNReanimated/RNGestureHandlerStateManager.h>
#import <React/RCTUIManager.h>
#include <string>
#include <utility>
#include <vector>

namespace reanimated {

std::vector<std::pair<std::string, double>> measure(
    int viewTag,
    RCTUIManager *uiManager);
void scrollTo(
    int scrollViewTag,
    RCTUIManager *uiManager,
    double x,
    double y,
    bool animated);
void setGestureState(
    id<RNGestureHandlerStateManager> gestureHandlerStateManager,
    int handlerTag,
    int newState);

} // namespace reanimated
