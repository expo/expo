#import <Foundation/Foundation.h>
#import <vector>
#import <string>
#import <ABI39_0_0React/ABI39_0_0RCTUIManager.h>

namespace ABI39_0_0reanimated {

std::vector<std::pair<std::string,double>> measure(int viewTag, ABI39_0_0RCTUIManager *uiManager);
void scrollTo(int scrollViewTag, ABI39_0_0RCTUIManager *uiManager, double x, double y, bool animated);

}
