#import <Foundation/Foundation.h>
#import "DevMenuRNGestureHandlerStateManager.h"
#import <React/RCTUIManager.h>
#include <string>
#include <utility>
#include <vector>

namespace devmenureanimated {

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
    id<DevMenuRNGestureHandlerStateManager> gestureHandlerStateManager,
    int handlerTag,
    int newState);

} // namespace devmenureanimated
