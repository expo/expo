#import <Foundation/Foundation.h>
#import <RNReanimated/REAIOSLogger.h>

namespace reanimated {

std::unique_ptr<LoggerInterface> Logger::instance = std::make_unique<REAIOSLogger>();

void REAIOSLogger::log(const char *str)
{
  NSLog(@"%@", [NSString stringWithCString:str encoding:[NSString defaultCStringEncoding]]);
}

void REAIOSLogger::log(double d)
{
  NSLog(@"%lf", d);
}

void REAIOSLogger::log(int i)
{
  NSLog(@"%i", i);
}

void REAIOSLogger::log(bool b)
{
  const char *str = (b) ? "true" : "false";
  NSLog(@"%@", [NSString stringWithCString:str encoding:[NSString defaultCStringEncoding]]);
}

}
