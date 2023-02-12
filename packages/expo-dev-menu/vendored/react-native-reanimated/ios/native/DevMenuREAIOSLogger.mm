#import <Foundation/Foundation.h>
#import "DevMenuREAIOSLogger.h"

namespace devmenureanimated {

std::unique_ptr<LoggerInterface> Logger::instance = std::make_unique<DevMenuREAIOSLogger>();

void DevMenuREAIOSLogger::log(const char *str)
{
  NSLog(@"%@", [NSString stringWithCString:str encoding:[NSString defaultCStringEncoding]]);
}

void DevMenuREAIOSLogger::log(double d)
{
  NSLog(@"%lf", d);
}

void DevMenuREAIOSLogger::log(int i)
{
  NSLog(@"%i", i);
}

void DevMenuREAIOSLogger::log(bool b)
{
  const char *str = (b) ? "true" : "false";
  NSLog(@"%@", [NSString stringWithCString:str encoding:[NSString defaultCStringEncoding]]);
}

}
