#import <Foundation/Foundation.h>
#import <ABI48_0_0RNReanimated/ABI48_0_0REAIOSLogger.h>

namespace ABI48_0_0reanimated {

std::unique_ptr<LoggerInterface> Logger::instance = std::make_unique<ABI48_0_0REAIOSLogger>();

void ABI48_0_0REAIOSLogger::log(const char *str)
{
  NSLog(@"%@", [NSString stringWithCString:str encoding:[NSString defaultCStringEncoding]]);
}

void ABI48_0_0REAIOSLogger::log(double d)
{
  NSLog(@"%lf", d);
}

void ABI48_0_0REAIOSLogger::log(int i)
{
  NSLog(@"%i", i);
}

void ABI48_0_0REAIOSLogger::log(bool b)
{
  const char *str = (b) ? "true" : "false";
  NSLog(@"%@", [NSString stringWithCString:str encoding:[NSString defaultCStringEncoding]]);
}

}
