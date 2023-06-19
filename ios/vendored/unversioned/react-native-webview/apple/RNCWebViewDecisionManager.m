#import "RNCWebViewDecisionManager.h"



@implementation RNCWebViewDecisionManager

@synthesize nextLockIdentifier;
@synthesize decisionHandlers;

+ (id)getInstance {
    static RNCWebViewDecisionManager *lockManager = nil;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        lockManager = [[self alloc] init];
    });
    return lockManager;
}

- (int)setDecisionHandler:(DecisionBlock)decisionHandler {
    int lockIdentifier = self.nextLockIdentifier++;

    [self.decisionHandlers setObject:decisionHandler forKey:@(lockIdentifier)];
    return lockIdentifier;
}

- (void) setResult:(BOOL)shouldStart
 forLockIdentifier:(int)lockIdentifier {
    DecisionBlock handler = [self.decisionHandlers objectForKey:@(lockIdentifier)];
    if (handler == nil) {
        RCTLogWarn(@"Lock not found");
        return;
    }
    handler(shouldStart);
    [self.decisionHandlers removeObjectForKey:@(lockIdentifier)];
}

- (id)init {
  if (self = [super init]) {
      self.nextLockIdentifier = 1;
      self.decisionHandlers = [[NSMutableDictionary alloc] init];
  }
  return self;
}

- (void)dealloc {}

@end
