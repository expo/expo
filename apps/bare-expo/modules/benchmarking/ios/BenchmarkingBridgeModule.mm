#import <BenchmarkingModule/BenchmarkingBridgeModule.h>

@implementation BenchmarkingBridgeModule

RCT_EXPORT_MODULE(BenchmarkingBridgeModule);

RCT_EXPORT_SYNCHRONOUS_TYPED_METHOD(void, nothing) {}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(addNumbers:(double)a b:(double)b)
{
  NSNumber* number = [[NSNumber alloc] initWithDouble:a + b];
  return number;
}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(addStrings:(NSString *)a b:(NSString *)b)
{
  NSMutableString* result = [[NSMutableString alloc] initWithString:a];
  [result appendString:b];
  return result;
}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(foldArray:(NSArray *)array)
{
  double sum = 0.0;
  for (NSNumber *num in array) {
    sum += [num doubleValue];
  }
  return @(sum);
}

@end
