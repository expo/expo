#include "ABI42_0_0REAIOSLogger.h"
#import <Foundation/Foundation.h>

namespace ABI42_0_0reanimated {

std::unique_ptr<LoggerInterface> Logger::instance = std::make_unique<ABI42_0_0REAIOSLogger>();

void ABI42_0_0REAIOSLogger::log(const char* str) {
  NSLog(@"%@", [NSString stringWithCString:str encoding:[NSString defaultCStringEncoding]]);
}

void ABI42_0_0REAIOSLogger::log(double d) {
  NSLog(@"%lf", d);
}

void ABI42_0_0REAIOSLogger::log(int i) {
   NSLog(@"%i", i);
}

void ABI42_0_0REAIOSLogger::log(bool b) {
  const char* str = (b)? "true" : "false";
  NSLog(@"%@", [NSString stringWithCString:str encoding:[NSString defaultCStringEncoding]]);
}

}
