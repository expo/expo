#import <Foundation/Foundation.h>
#import <React/RCTLog.h>
#import <WebKit/WebKit.h>

typedef void (^DecisionBlock)(BOOL);

@interface RNCWebViewDecisionManager : NSObject {
    int nextLockIdentifier;
    NSMutableDictionary *decisionHandlers;
}

@property (nonatomic) int nextLockIdentifier;
@property (nonatomic, retain) NSMutableDictionary *decisionHandlers;

+ (id)      getInstance;

- (int)setDecisionHandler:(DecisionBlock)handler;
- (void)    setResult:(BOOL)shouldStart
    forLockIdentifier:(int)lockIdentifier;
@end
