#import <Foundation/Foundation.h>
#import <vector>
#import <string>
#import <ABI44_0_0React/ABI44_0_0RCTUIManager.h>

namespace ABI44_0_0reanimated {

std::vector<std::pair<std::string,double>> measure(int viewTag, ABI44_0_0RCTUIManager *uiManager);
void scrollTo(int scrollViewTag, ABI44_0_0RCTUIManager *uiManager, double x, double y, bool animated);

}
