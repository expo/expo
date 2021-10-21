#import <EXBlur/EXUIBlurEffect.h>
#import <objc/runtime.h>

@interface UIBlurEffect (Protected)

@property (nonatomic, readonly) id effectSettings;

@end

@interface EXUIBlurEffect ()

@property (nonatomic, strong) NSNumber *blurRadius;

@end

@implementation EXUIBlurEffect

+ (instancetype)effectWithStyle:(UIBlurEffectStyle)style
{
  id instance = [super effectWithStyle:style];
  object_setClass(instance, self);
  return instance;
}

+ (instancetype)effectWithStyle:(UIBlurEffectStyle)style andBlurRadius:(NSNumber *)blurRadius
{
  EXUIBlurEffect *effect = (EXUIBlurEffect*)[self effectWithStyle:style];
  effect.blurRadius = blurRadius;
  return effect;
}

- (void)setBlurRadius:(NSNumber *)blurRadius
{
  objc_setAssociatedObject(self,
                           @selector(blurRadius),
                           blurRadius,
                           OBJC_ASSOCIATION_RETAIN_NONATOMIC);
}

- (NSNumber *)blurRadius
{
  return objc_getAssociatedObject(self, @selector(blurRadius));
}

- (id)effectSettings
{
    id settings = [super effectSettings];
    NSNumber *blurRadius = self.blurRadius;
    if (blurRadius) {
      [settings setValue:blurRadius forKey:@"blurRadius"];
    }
    return settings;
}

- (id)copyWithZone:(NSZone*)zone
{
    id instance = [super copyWithZone:zone];
    object_setClass(instance, [self class]);
    objc_setAssociatedObject(instance,
                             @selector(blurRadius),
                             self.blurRadius,
                             OBJC_ASSOCIATION_RETAIN_NONATOMIC);
    return instance;
}

@end
