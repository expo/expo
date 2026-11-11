#import "RNCWebViewDecisionManager.h"

/**
 * Thread-safe singleton that manages navigation decision handlers for WKWebView.
 *
 * This class bridges async navigation decisions between:
 * - WKWebView delegate (main thread) - stores decision handlers
 * - React Native bridge (background thread) - resolves decisions from JS
 *
 * All public methods use @synchronized for thread safety since they access
 * shared state (nextLockIdentifier and decisionHandlers) from different threads.
 */
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

/**
 * Stores a decision handler and returns a unique identifier.
 * Called from the main thread (WKNavigationDelegate).
 * @synchronized ensures atomic increment + insertion.
 */
- (int)setDecisionHandler:(DecisionBlock)decisionHandler {
    @synchronized (self) {
        int lockIdentifier = self.nextLockIdentifier++;
        [self.decisionHandlers setObject:decisionHandler forKey:@(lockIdentifier)];
        return lockIdentifier;
    }
}

/**
 * Resolves a pending navigation decision.
 * Called from the RN bridge thread (background) when JS responds.
 *
 * The handler is invoked OUTSIDE the @synchronized block to prevent deadlocks,
 * since the handler dispatches to the main queue and could potentially
 * trigger another navigation that re-enters this class.
 */
- (void) setResult:(BOOL)shouldStart
 forLockIdentifier:(int)lockIdentifier {
    DecisionBlock handler;
    @synchronized (self) {
        handler = [self.decisionHandlers objectForKey:@(lockIdentifier)];
        if (handler == nil) {
            RCTLogWarn(@"Lock not found");
            return;
        }
        [self.decisionHandlers removeObjectForKey:@(lockIdentifier)];
    }
    handler(shouldStart);
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
