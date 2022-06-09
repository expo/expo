#import <Foundation/Foundation.h>
#import <ABI45_0_0RNReanimated/ABI45_0_0REAIOSLogger.h>

namespace ABI45_0_0reanimated {

std::unique_ptr<LoggerInterface> Logger::instance = std::make_unique<ABI45_0_0REAIOSLogger>();

void ABI45_0_0REAIOSLogger::log(const char *str)
{
  NSLog(@"%@", [NSString stringWithCString:str encoding:[NSString defaultCStringEncoding]]);
}

void ABI45_0_0REAIOSLogger::log(double d)
{
  NSLog(@"%lf", d);
}

void ABI45_0_0REAIOSLogger::log(int i)
{
  NSLog(@"%i", i);
}

void ABI45_0_0REAIOSLogger::log(bool b)
{
  const char *str = (b) ? "true" : "false";
  NSLog(@"%@", [NSString stringWithCString:str encoding:[NSString defaultCStringEncoding]]);
}

}
