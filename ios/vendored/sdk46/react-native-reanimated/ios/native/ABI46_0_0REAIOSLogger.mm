#import <Foundation/Foundation.h>
#import <ABI46_0_0RNReanimated/ABI46_0_0REAIOSLogger.h>

namespace ABI46_0_0reanimated {

std::unique_ptr<LoggerInterface> Logger::instance = std::make_unique<ABI46_0_0REAIOSLogger>();

void ABI46_0_0REAIOSLogger::log(const char *str)
{
  NSLog(@"%@", [NSString stringWithCString:str encoding:[NSString defaultCStringEncoding]]);
}

void ABI46_0_0REAIOSLogger::log(double d)
{
  NSLog(@"%lf", d);
}

void ABI46_0_0REAIOSLogger::log(int i)
{
  NSLog(@"%i", i);
}

void ABI46_0_0REAIOSLogger::log(bool b)
{
  const char *str = (b) ? "true" : "false";
  NSLog(@"%@", [NSString stringWithCString:str encoding:[NSString defaultCStringEncoding]]);
}

}
