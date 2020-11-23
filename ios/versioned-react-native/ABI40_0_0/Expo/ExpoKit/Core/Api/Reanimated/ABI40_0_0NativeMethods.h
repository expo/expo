#import <Foundation/Foundation.h>
#import <vector>
#import <string>
#import <ABI40_0_0React/ABI40_0_0RCTUIManager.h>

namespace ABI40_0_0reanimated {

std::vector<std::pair<std::string,double>> measure(int viewTag, ABI40_0_0RCTUIManager *uiManager);
void scrollTo(int scrollViewTag, ABI40_0_0RCTUIManager *uiManager, double x, double y, bool animated);

}
