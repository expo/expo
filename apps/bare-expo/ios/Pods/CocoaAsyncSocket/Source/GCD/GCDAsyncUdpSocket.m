//  
//  GCDAsyncUdpSocket
//  
//  This class is in the public domain.
//  Originally created by Robbie Hanson of Deusty LLC.
//  Updated and maintained by Deusty LLC and the Apple development community.
//  
//  https://github.com/robbiehanson/CocoaAsyncSocket
//

#import "GCDAsyncUdpSocket.h"

#if ! __has_feature(objc_arc)
#warning This file must be compiled with ARC. Use -fobjc-arc flag (or convert project to ARC).
// For more information see: https://github.com/robbiehanson/CocoaAsyncSocket/wiki/ARC
#endif

#if TARGET_OS_IPHONE
  #import <CFNetwork/CFNetwork.h>
  #import <UIKit/UIKit.h>
#endif

#import <arpa/inet.h>
#import <fcntl.h>
#import <ifaddrs.h>
#import <netdb.h>
#import <net/if.h>
#import <sys/socket.h>
#import <sys/types.h>


#if 0

// Logging Enabled - See log level below

// Logging uses the CocoaLumberjack framework (which is also GCD based).
// https://github.com/robbiehanson/CocoaLumberjack
// 
// It allows us to do a lot of logging without significantly slowing down the code.
#import "DDLog.h"

#define LogAsync   NO
#define LogContext 65535

#define LogObjc(flg, frmt, ...) LOG_OBJC_MAYBE(LogAsync, logLevel, flg, LogContext, frmt, ##__VA_ARGS__)
#define LogC(flg, frmt, ...)    LOG_C_MAYBE(LogAsync, logLevel, flg, LogContext, frmt, ##__VA_ARGS__)

#define LogError(frmt, ...)     LogObjc(LOG_FLAG_ERROR,   (@"%@: " frmt), THIS_FILE, ##__VA_ARGS__)
#define LogWarn(frmt, ...)      LogObjc(LOG_FLAG_WARN,    (@"%@: " frmt), THIS_FILE, ##__VA_ARGS__)
#define LogInfo(frmt, ...)      LogObjc(LOG_FLAG_INFO,    (@"%@: " frmt), THIS_FILE, ##__VA_ARGS__)
#define LogVerbose(frmt, ...)   LogObjc(LOG_FLAG_VERBOSE, (@"%@: " frmt), THIS_FILE, ##__VA_ARGS__)

#define LogCError(frmt, ...)    LogC(LOG_FLAG_ERROR,   (@"%@: " frmt), THIS_FILE, ##__VA_ARGS__)
#define LogCWarn(frmt, ...)     LogC(LOG_FLAG_WARN,    (@"%@: " frmt), THIS_FILE, ##__VA_ARGS__)
#define LogCInfo(frmt, ...)     LogC(LOG_FLAG_INFO,    (@"%@: " frmt), THIS_FILE, ##__VA_ARGS__)
#define LogCVerbose(frmt, ...)  LogC(LOG_FLAG_VERBOSE, (@"%@: " frmt), THIS_FILE, ##__VA_ARGS__)

#define LogTrace()              LogObjc(LOG_FLAG_VERBOSE, @"%@: %@", THIS_FILE, THIS_METHOD)
#define LogCTrace()             LogC(LOG_FLAG_VERBOSE, @"%@: %s", THIS_FILE, __FUNCTION__)

// Log levels : off, error, warn, info, verbose
static const int logLevel = LOG_LEVEL_VERBOSE;

#else

// Logging Disabled

#define LogError(frmt, ...)     {}
#define LogWarn(frmt, ...)      {}
#define LogInfo(frmt, ...)      {}
#define LogVerbose(frmt, ...)   {}

#define LogCError(frmt, ...)    {}
#define LogCWarn(frmt, ...)     {}
#define LogCInfo(frmt, ...)     {}
#define LogCVerbose(frmt, ...)  {}

#define LogTrace()              {}
#define LogCTrace(frmt, ...)    {}

#endif

/**
 * Seeing a return statements within an inner block
 * can sometimes be mistaken for a return point of the enclosing method.
 * This makes inline blocks a bit easier to read.
**/
#define return_from_block  return

/**
 * A socket file descriptor is really just an integer.
 * It represents the index of the socket within the kernel.
 * This makes invalid file descriptor comparisons easier to read.
**/
#define SOCKET_NULL -1

/**
 * Just to type less code.
**/
#define AutoreleasedBlock(block) ^{ @autoreleasepool { block(); }} 


@class GCDAsyncUdpSendPacket;

NSString *const GCDAsyncUdpSocketException = @"GCDAsyncUdpSocketException";
NSString *const GCDAsyncUdpSocketErrorDomain = @"GCDAsyncUdpSocketErrorDomain";

NSString *const GCDAsyncUdpSocketQueueName = @"GCDAsyncUdpSocket";
NSString *const GCDAsyncUdpSocketThreadName = @"GCDAsyncUdpSocket-CFStream";

enum GCDAsyncUdpSocketFlags
{
	kDidCreateSockets        = 1 <<  0,  // If set, the sockets have been created.
	kDidBind                 = 1 <<  1,  // If set, bind has been called.
	kConnecting              = 1 <<  2,  // If set, a connection attempt is in progress.
	kDidConnect              = 1 <<  3,  // If set, socket is connected.
	kReceiveOnce             = 1 <<  4,  // If set, one-at-a-time receive is enabled
	kReceiveContinuous       = 1 <<  5,  // If set, continuous receive is enabled
	kIPv4Deactivated         = 1 <<  6,  // If set, socket4 was closed due to bind or connect on IPv6.
	kIPv6Deactivated         = 1 <<  7,  // If set, socket6 was closed due to bind or connect on IPv4.
	kSend4SourceSuspended    = 1 <<  8,  // If set, send4Source is suspended.
	kSend6SourceSuspended    = 1 <<  9,  // If set, send6Source is suspended.
	kReceive4SourceSuspended = 1 << 10,  // If set, receive4Source is suspended.
	kReceive6SourceSuspended = 1 << 11,  // If set, receive6Source is suspended.
	kSock4CanAcceptBytes     = 1 << 12,  // If set, we know socket4 can accept bytes. If unset, it's unknown.
	kSock6CanAcceptBytes     = 1 << 13,  // If set, we know socket6 can accept bytes. If unset, it's unknown.
	kForbidSendReceive       = 1 << 14,  // If set, no new send or receive operations are allowed to be queued.
	kCloseAfterSends         = 1 << 15,  // If set, close as soon as no more sends are queued.
	kFlipFlop                = 1 << 16,  // Used to alternate between IPv4 and IPv6 sockets.
#if TARGET_OS_IPHONE
	kAddedStreamListener     = 1 << 17,  // If set, CFStreams have been added to listener thread
#endif
};

enum GCDAsyncUdpSocketConfig
{
	kIPv4Disabled  = 1 << 0,  // If set, IPv4 is disabled
	kIPv6Disabled  = 1 << 1,  // If set, IPv6 is disabled
	kPreferIPv4    = 1 << 2,  // If set, IPv4 is preferred over IPv6
	kPreferIPv6    = 1 << 3,  // If set, IPv6 is preferred over IPv4
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
#pragma mark -
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

@interface GCDAsyncUdpSocket ()
{
#if __has_feature(objc_arc_weak)
	__weak id delegate;
#else
	__unsafe_unretained id delegate;
#endif
	dispatch_queue_t delegateQueue;
	
	GCDAsyncUdpSocketReceiveFilterBlock receiveFilterBlock;
	dispatch_queue_t receiveFilterQueue;
	BOOL receiveFilterAsync;
	
	GCDAsyncUdpSocketSendFilterBlock sendFilterBlock;
	dispatch_queue_t sendFilterQueue;
	BOOL sendFilterAsync;
	
	uint32_t flags;
	uint16_t config;
	
	uint16_t max4ReceiveSize;
	uint32_t max6ReceiveSize;
    
    uint16_t maxSendSize;
	
	int socket4FD;
	int socket6FD;
	
	dispatch_queue_t socketQueue;
	
	dispatch_source_t send4Source;
	dispatch_source_t send6Source;
	dispatch_source_t receive4Source;
	dispatch_source_t receive6Source;
	dispatch_source_t sendTimer;
	
	GCDAsyncUdpSendPacket *currentSend;
	NSMutableArray *sendQueue;
	
	unsigned long socket4FDBytesAvailable;
	unsigned long socket6FDBytesAvailable;
	
	uint32_t pendingFilterOperations;
	
	NSData   *cachedLocalAddress4;
	NSString *cachedLocalHost4;
	uint16_t  cachedLocalPort4;
	
	NSData   *cachedLocalAddress6;
	NSString *cachedLocalHost6;
	uint16_t  cachedLocalPort6;
	
	NSData   *cachedConnectedAddress;
	NSString *cachedConnectedHost;
	uint16_t  cachedConnectedPort;
	int       cachedConnectedFamily;

	void *IsOnSocketQueueOrTargetQueueKey;    
	
#if TARGET_OS_IPHONE
	CFStreamClientContext streamContext;
	CFReadStreamRef readStream4;
	CFReadStreamRef readStream6;
	CFWriteStreamRef writeStream4;
	CFWriteStreamRef writeStream6;
#endif
	
	id userData;
}

- (void)resumeSend4Source;
- (void)resumeSend6Source;
- (void)resumeReceive4Source;
- (void)resumeReceive6Source;
- (void)closeSockets;

- (void)maybeConnect;
- (BOOL)connectWithAddress4:(NSData *)address4 error:(NSError **)errPtr;
- (BOOL)connectWithAddress6:(NSData *)address6 error:(NSError **)errPtr;

- (void)maybeDequeueSend;
- (void)doPreSend;
- (void)doSend;
- (void)endCurrentSend;
- (void)setupSendTimerWithTimeout:(NSTimeInterval)timeout;

- (void)doReceive;
- (void)doReceiveEOF;

- (void)closeWithError:(NSError *)error;

- (BOOL)performMulticastRequest:(int)requestType forGroup:(NSString *)group onInterface:(NSString *)interface error:(NSError **)errPtr;

#if TARGET_OS_IPHONE
- (BOOL)createReadAndWriteStreams:(NSError **)errPtr;
- (BOOL)registerForStreamCallbacks:(NSError **)errPtr;
- (BOOL)addStreamsToRunLoop:(NSError **)errPtr;
- (BOOL)openStreams:(NSError **)errPtr;
- (void)removeStreamsFromRunLoop;
- (void)closeReadAndWriteStreams;
#endif

+ (NSString *)hostFromSockaddr4:(const struct sockaddr_in *)pSockaddr4;
+ (NSString *)hostFromSockaddr6:(const struct sockaddr_in6 *)pSockaddr6;
+ (uint16_t)portFromSockaddr4:(const struct sockaddr_in *)pSockaddr4;
+ (uint16_t)portFromSockaddr6:(const struct sockaddr_in6 *)pSockaddr6;

#if TARGET_OS_IPHONE
// Forward declaration
+ (void)listenerThread:(id)unused;
#endif

@end

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
#pragma mark -
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * The GCDAsyncUdpSendPacket encompasses the instructions for a single send/write.
**/
@interface GCDAsyncUdpSendPacket : NSObject {
@public
	NSData *buffer;
	NSTimeInterval timeout;
	long tag;
	
	BOOL resolveInProgress;
	BOOL filterInProgress;
	
	NSArray *resolvedAddresses;
	NSError *resolveError;
	
	NSData *address;
	int addressFamily;
}

- (instancetype)initWithData:(NSData *)d timeout:(NSTimeInterval)t tag:(long)i NS_DESIGNATED_INITIALIZER;

@end

@implementation GCDAsyncUdpSendPacket

// Cover the superclass' designated initializer
- (instancetype)init NS_UNAVAILABLE
{
	NSAssert(0, @"Use the designated initializer");
	return nil;
}

- (instancetype)initWithData:(NSData *)d timeout:(NSTimeInterval)t tag:(long)i
{
	if ((self = [super init]))
	{
		buffer = d;
		timeout = t;
		tag = i;
		
		resolveInProgress = NO;
	}
	return self;
}


@end

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
#pragma mark -
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

@interface GCDAsyncUdpSpecialPacket : NSObject {
@public
//	uint8_t type;
	
	BOOL resolveInProgress;
	
	NSArray *addresses;
	NSError *error;
}

- (instancetype)init NS_DESIGNATED_INITIALIZER;

@end

@implementation GCDAsyncUdpSpecialPacket

- (instancetype)init
{
	self = [super init];
	return self;
}


@end

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
#pragma mark -
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

@implementation GCDAsyncUdpSocket

- (instancetype)init
{
	LogTrace();
	
	return [self initWithDelegate:nil delegateQueue:NULL socketQueue:NULL];
}

- (instancetype)initWithSocketQueue:(dispatch_queue_t)sq
{
	LogTrace();
	
	return [self initWithDelegate:nil delegateQueue:NULL socketQueue:sq];
}

- (instancetype)initWithDelegate:(id<GCDAsyncUdpSocketDelegate>)aDelegate delegateQueue:(dispatch_queue_t)dq
{
	LogTrace();
	
	return [self initWithDelegate:aDelegate delegateQueue:dq socketQueue:NULL];
}

- (instancetype)initWithDelegate:(id<GCDAsyncUdpSocketDelegate>)aDelegate delegateQueue:(dispatch_queue_t)dq socketQueue:(dispatch_queue_t)sq
{
	LogTrace();
	
	if ((self = [super init]))
	{
		delegate = aDelegate;
		
		if (dq)
		{
			delegateQueue = dq;
			#if !OS_OBJECT_USE_OBJC
			dispatch_retain(delegateQueue);
			#endif
		}
		
		max4ReceiveSize = 65535;
		max6ReceiveSize = 65535;
		
        maxSendSize = 65535;
        
		socket4FD = SOCKET_NULL;
		socket6FD = SOCKET_NULL;
		
		if (sq)
		{
			NSAssert(sq != dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_LOW, 0),
			         @"The given socketQueue parameter must not be a concurrent queue.");
			NSAssert(sq != dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_HIGH, 0),
			         @"The given socketQueue parameter must not be a concurrent queue.");
			NSAssert(sq != dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0),
			         @"The given socketQueue parameter must not be a concurrent queue.");
			
			socketQueue = sq;
			#if !OS_OBJECT_USE_OBJC
			dispatch_retain(socketQueue);
			#endif
		}
		else
		{
			socketQueue = dispatch_queue_create([GCDAsyncUdpSocketQueueName UTF8String], NULL);
		}

		// The dispatch_queue_set_specific() and dispatch_get_specific() functions take a "void *key" parameter.
		// From the documentation:
		//
		// > Keys are only compared as pointers and are never dereferenced.
		// > Thus, you can use a pointer to a static variable for a specific subsystem or
		// > any other value that allows you to identify the value uniquely.
		//
		// We're just going to use the memory address of an ivar.
		// Specifically an ivar that is explicitly named for our purpose to make the code more readable.
		//
		// However, it feels tedious (and less readable) to include the "&" all the time:
		// dispatch_get_specific(&IsOnSocketQueueOrTargetQueueKey)
		//
		// So we're going to make it so it doesn't matter if we use the '&' or not,
		// by assigning the value of the ivar to the address of the ivar.
		// Thus: IsOnSocketQueueOrTargetQueueKey == &IsOnSocketQueueOrTargetQueueKey;

		IsOnSocketQueueOrTargetQueueKey = &IsOnSocketQueueOrTargetQueueKey;

		void *nonNullUnusedPointer = (__bridge void *)self;
		dispatch_queue_set_specific(socketQueue, IsOnSocketQueueOrTargetQueueKey, nonNullUnusedPointer, NULL);
		
		currentSend = nil;
		sendQueue = [[NSMutableArray alloc] initWithCapacity:5];
		
		#if TARGET_OS_IPHONE
		[[NSNotificationCenter defaultCenter] addObserver:self
		                                         selector:@selector(applicationWillEnterForeground:)
		                                             name:UIApplicationWillEnterForegroundNotification
		                                           object:nil];
		#endif
	}
	return self;
}

- (void)dealloc
{
	LogInfo(@"%@ - %@ (start)", THIS_METHOD, self);
	
#if TARGET_OS_IPHONE
	[[NSNotificationCenter defaultCenter] removeObserver:self];
#endif
	
	if (dispatch_get_specific(IsOnSocketQueueOrTargetQueueKey))
	{
		[self closeWithError:nil];
	}
	else
	{
		dispatch_sync(socketQueue, ^{
			[self closeWithError:nil];
		});
	}
	
	delegate = nil;
	#if !OS_OBJECT_USE_OBJC
	if (delegateQueue) dispatch_release(delegateQueue);
	#endif
	delegateQueue = NULL;
	
	#if !OS_OBJECT_USE_OBJC
	if (socketQueue) dispatch_release(socketQueue);
	#endif
	socketQueue = NULL;
	
	LogInfo(@"%@ - %@ (finish)", THIS_METHOD, self);
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
#pragma mark Configuration
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

- (id<GCDAsyncUdpSocketDelegate>)delegate
{
	if (dispatch_get_specific(IsOnSocketQueueOrTargetQueueKey))
	{
		return delegate;
	}
	else
	{
		__block id result = nil;
		
		dispatch_sync(socketQueue, ^{
            result = self->delegate;
		});
		
		return result;
	}
}

- (void)setDelegate:(id<GCDAsyncUdpSocketDelegate>)newDelegate synchronously:(BOOL)synchronously
{
	dispatch_block_t block = ^{
        self->delegate = newDelegate;
	};
	
	if (dispatch_get_specific(IsOnSocketQueueOrTargetQueueKey)) {
		block();
	}
	else {
		if (synchronously)
			dispatch_sync(socketQueue, block);
		else
			dispatch_async(socketQueue, block);
	}
}

- (void)setDelegate:(id<GCDAsyncUdpSocketDelegate>)newDelegate
{
	[self setDelegate:newDelegate synchronously:NO];
}

- (void)synchronouslySetDelegate:(id<GCDAsyncUdpSocketDelegate>)newDelegate
{
	[self setDelegate:newDelegate synchronously:YES];
}

- (dispatch_queue_t)delegateQueue
{
	if (dispatch_get_specific(IsOnSocketQueueOrTargetQueueKey))
	{
		return delegateQueue;
	}
	else
	{
		__block dispatch_queue_t result = NULL;
		
		dispatch_sync(socketQueue, ^{
            result = self->delegateQueue;
		});
		
		return result;
	}
}

- (void)setDelegateQueue:(dispatch_queue_t)newDelegateQueue synchronously:(BOOL)synchronously
{
	dispatch_block_t block = ^{
		
		#if !OS_OBJECT_USE_OBJC
        if (self->delegateQueue) dispatch_release(self->delegateQueue);
		if (newDelegateQueue) dispatch_retain(newDelegateQueue);
		#endif
		
        self->delegateQueue = newDelegateQueue;
	};
	
	if (dispatch_get_specific(IsOnSocketQueueOrTargetQueueKey)) {
		block();
	}
	else {
		if (synchronously)
			dispatch_sync(socketQueue, block);
		else
			dispatch_async(socketQueue, block);
	}
}

- (void)setDelegateQueue:(dispatch_queue_t)newDelegateQueue
{
	[self setDelegateQueue:newDelegateQueue synchronously:NO];
}

- (void)synchronouslySetDelegateQueue:(dispatch_queue_t)newDelegateQueue
{
	[self setDelegateQueue:newDelegateQueue synchronously:YES];
}

- (void)getDelegate:(id<GCDAsyncUdpSocketDelegate> *)delegatePtr delegateQueue:(dispatch_queue_t *)delegateQueuePtr
{
	if (dispatch_get_specific(IsOnSocketQueueOrTargetQueueKey))
	{
		if (delegatePtr) *delegatePtr = delegate;
		if (delegateQueuePtr) *delegateQueuePtr = delegateQueue;
	}
	else
	{
		__block id dPtr = NULL;
		__block dispatch_queue_t dqPtr = NULL;
		
		dispatch_sync(socketQueue, ^{
            dPtr = self->delegate;
            dqPtr = self->delegateQueue;
		});
		
		if (delegatePtr) *delegatePtr = dPtr;
		if (delegateQueuePtr) *delegateQueuePtr = dqPtr;
	}
}

- (void)setDelegate:(id<GCDAsyncUdpSocketDelegate>)newDelegate delegateQueue:(dispatch_queue_t)newDelegateQueue synchronously:(BOOL)synchronously
{
	dispatch_block_t block = ^{
		
        self->delegate = newDelegate;
		
		#if !OS_OBJECT_USE_OBJC
        if (self->delegateQueue) dispatch_release(self->delegateQueue);
		if (newDelegateQueue) dispatch_retain(newDelegateQueue);
		#endif
		
        self->delegateQueue = newDelegateQueue;
	};
	
	if (dispatch_get_specific(IsOnSocketQueueOrTargetQueueKey)) {
		block();
	}
	else {
		if (synchronously)
			dispatch_sync(socketQueue, block);
		else
			dispatch_async(socketQueue, block);
	}
}

- (void)setDelegate:(id<GCDAsyncUdpSocketDelegate>)newDelegate delegateQueue:(dispatch_queue_t)newDelegateQueue
{
	[self setDelegate:newDelegate delegateQueue:newDelegateQueue synchronously:NO];
}

- (void)synchronouslySetDelegate:(id<GCDAsyncUdpSocketDelegate>)newDelegate delegateQueue:(dispatch_queue_t)newDelegateQueue
{
	[self setDelegate:newDelegate delegateQueue:newDelegateQueue synchronously:YES];
}

- (BOOL)isIPv4Enabled
{
	// Note: YES means kIPv4Disabled is OFF
	
	__block BOOL result = NO;
	
	dispatch_block_t block = ^{
		
        result = ((self->config & kIPv4Disabled) == 0);
	};
	
	if (dispatch_get_specific(IsOnSocketQueueOrTargetQueueKey))
		block();
	else
		dispatch_sync(socketQueue, block);
	
	return result;
}

- (void)setIPv4Enabled:(BOOL)flag
{
	// Note: YES means kIPv4Disabled is OFF
	
	dispatch_block_t block = ^{
		
		LogVerbose(@"%@ %@", THIS_METHOD, (flag ? @"YES" : @"NO"));
		
		if (flag)
            self->config &= ~kIPv4Disabled;
		else
            self->config |= kIPv4Disabled;
	};
	
	if (dispatch_get_specific(IsOnSocketQueueOrTargetQueueKey))
		block();
	else
		dispatch_async(socketQueue, block);
}

- (BOOL)isIPv6Enabled
{
	// Note: YES means kIPv6Disabled is OFF
	
	__block BOOL result = NO;
	
	dispatch_block_t block = ^{
		
        result = ((self->config & kIPv6Disabled) == 0);
	};
	
	if (dispatch_get_specific(IsOnSocketQueueOrTargetQueueKey))
		block();
	else
		dispatch_sync(socketQueue, block);
	
	return result;
}

- (void)setIPv6Enabled:(BOOL)flag
{
	// Note: YES means kIPv6Disabled is OFF
	
	dispatch_block_t block = ^{
		
		LogVerbose(@"%@ %@", THIS_METHOD, (flag ? @"YES" : @"NO"));
		
		if (flag)
            self->config &= ~kIPv6Disabled;
		else
            self->config |= kIPv6Disabled;
	};
	
	if (dispatch_get_specific(IsOnSocketQueueOrTargetQueueKey))
		block();
	else
		dispatch_async(socketQueue, block);
}

- (BOOL)isIPv4Preferred
{
	__block BOOL result = NO;
	
	dispatch_block_t block = ^{
        result = (self->config & kPreferIPv4) ? YES : NO;
	};
	
	if (dispatch_get_specific(IsOnSocketQueueOrTargetQueueKey))
		block();
	else
		dispatch_sync(socketQueue, block);
	
	return result;
}

- (BOOL)isIPv6Preferred
{
	__block BOOL result = NO;
	
	dispatch_block_t block = ^{
        result = (self->config & kPreferIPv6) ? YES : NO;
	};
	
	if (dispatch_get_specific(IsOnSocketQueueOrTargetQueueKey))
		block();
	else
		dispatch_sync(socketQueue, block);
	
	return result;
}

- (BOOL)isIPVersionNeutral
{
	__block BOOL result = NO;
	
	dispatch_block_t block = ^{
        result = (self->config & (kPreferIPv4 | kPreferIPv6)) == 0;
	};
	
	if (dispatch_get_specific(IsOnSocketQueueOrTargetQueueKey))
		block();
	else
		dispatch_sync(socketQueue, block);
	
	return result;
}

- (void)setPreferIPv4
{
	dispatch_block_t block = ^{
		
		LogTrace();
		
        self->config |=  kPreferIPv4;
        self->config &= ~kPreferIPv6;
		
	};
	
	if (dispatch_get_specific(IsOnSocketQueueOrTargetQueueKey))
		block();
	else
		dispatch_async(socketQueue, block);
}

- (void)setPreferIPv6
{
	dispatch_block_t block = ^{
		
		LogTrace();
		
        self->config &= ~kPreferIPv4;
        self->config |=  kPreferIPv6;
		
	};
	
	if (dispatch_get_specific(IsOnSocketQueueOrTargetQueueKey))
		block();
	else
		dispatch_async(socketQueue, block);
}

- (void)setIPVersionNeutral
{
	dispatch_block_t block = ^{
		
		LogTrace();
		
        self->config &= ~kPreferIPv4;
        self->config &= ~kPreferIPv6;
		
	};
	
	if (dispatch_get_specific(IsOnSocketQueueOrTargetQueueKey))
		block();
	else
		dispatch_async(socketQueue, block);
}

- (uint16_t)maxReceiveIPv4BufferSize
{
	__block uint16_t result = 0;
	
	dispatch_block_t block = ^{
		
        result = self->max4ReceiveSize;
	};
	
	if (dispatch_get_specific(IsOnSocketQueueOrTargetQueueKey))
		block();
	else
		dispatch_sync(socketQueue, block);
	
	return result;
}

- (void)setMaxReceiveIPv4BufferSize:(uint16_t)max
{
	dispatch_block_t block = ^{
		
		LogVerbose(@"%@ %u", THIS_METHOD, (unsigned)max);
		
        self->max4ReceiveSize = max;
	};
	
	if (dispatch_get_specific(IsOnSocketQueueOrTargetQueueKey))
		block();
	else
		dispatch_async(socketQueue, block);
}

- (uint32_t)maxReceiveIPv6BufferSize
{
	__block uint32_t result = 0;
	
	dispatch_block_t block = ^{
		
        result = self->max6ReceiveSize;
	};
	
	if (dispatch_get_specific(IsOnSocketQueueOrTargetQueueKey))
		block();
	else
		dispatch_sync(socketQueue, block);
	
	return result;
}

- (void)setMaxReceiveIPv6BufferSize:(uint32_t)max
{
	dispatch_block_t block = ^{
		
		LogVerbose(@"%@ %u", THIS_METHOD, (unsigned)max);
		
        self->max6ReceiveSize = max;
	};
	
	if (dispatch_get_specific(IsOnSocketQueueOrTargetQueueKey))
		block();
	else
		dispatch_async(socketQueue, block);
}

- (void)setMaxSendBufferSize:(uint16_t)max
{
    dispatch_block_t block = ^{
        
        LogVerbose(@"%@ %u", THIS_METHOD, (unsigned)max);
        
        self->maxSendSize = max;
    };
    
    if (dispatch_get_specific(IsOnSocketQueueOrTargetQueueKey))
        block();
    else
        dispatch_async(socketQueue, block);
}

- (uint16_t)maxSendBufferSize
{
    __block uint16_t result = 0;
    
    dispatch_block_t block = ^{
        
        result = self->maxSendSize;
    };
    
    if (dispatch_get_specific(IsOnSocketQueueOrTargetQueueKey))
        block();
    else
        dispatch_sync(socketQueue, block);
    
    return result;
}

- (id)userData
{
	__block id result = nil;
	
	dispatch_block_t block = ^{
		
        result = self->userData;
	};
	
	if (dispatch_get_specific(IsOnSocketQueueOrTargetQueueKey))
		block();
	else
		dispatch_sync(socketQueue, block);
	
	return result;
}

- (void)setUserData:(id)arbitraryUserData
{
	dispatch_block_t block = ^{
		
        if (self->userData != arbitraryUserData)
		{
            self->userData = arbitraryUserData;
		}
	};
	
	if (dispatch_get_specific(IsOnSocketQueueOrTargetQueueKey))
		block();
	else
		dispatch_async(socketQueue, block);
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
#pragma mark Delegate Helpers
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

- (void)notifyDidConnectToAddress:(NSData *)anAddress
{
	LogTrace();
	
	__strong id<GCDAsyncUdpSocketDelegate> theDelegate = delegate;
	if (delegateQueue && [theDelegate respondsToSelector:@selector(udpSocket:didConnectToAddress:)])
	{
		NSData *address = [anAddress copy]; // In case param is NSMutableData
		
		dispatch_async(delegateQueue, ^{ @autoreleasepool {
			
			[theDelegate udpSocket:self didConnectToAddress:address];
		}});
	}
}

- (void)notifyDidNotConnect:(NSError *)error
{
	LogTrace();
	
	__strong id<GCDAsyncUdpSocketDelegate> theDelegate = delegate;
	if (delegateQueue && [theDelegate respondsToSelector:@selector(udpSocket:didNotConnect:)])
	{
		dispatch_async(delegateQueue, ^{ @autoreleasepool {
			
			[theDelegate udpSocket:self didNotConnect:error];
		}});
	}
}

- (void)notifyDidSendDataWithTag:(long)tag
{
	LogTrace();
	
	__strong id<GCDAsyncUdpSocketDelegate> theDelegate = delegate;
	if (delegateQueue && [theDelegate respondsToSelector:@selector(udpSocket:didSendDataWithTag:)])
	{
		dispatch_async(delegateQueue, ^{ @autoreleasepool {
			
			[theDelegate udpSocket:self didSendDataWithTag:tag];
		}});
	}
}

- (void)notifyDidNotSendDataWithTag:(long)tag dueToError:(NSError *)error
{
	LogTrace();
	
	__strong id<GCDAsyncUdpSocketDelegate> theDelegate = delegate;
	if (delegateQueue && [theDelegate respondsToSelector:@selector(udpSocket:didNotSendDataWithTag:dueToError:)])
	{
		dispatch_async(delegateQueue, ^{ @autoreleasepool {
			
			[theDelegate udpSocket:self didNotSendDataWithTag:tag dueToError:error];
		}});
	}
}

- (void)notifyDidReceiveData:(NSData *)data fromAddress:(NSData *)address withFilterContext:(id)context
{
	LogTrace();
	
	SEL selector = @selector(udpSocket:didReceiveData:fromAddress:withFilterContext:);
	
	__strong id<GCDAsyncUdpSocketDelegate> theDelegate = delegate;
	if (delegateQueue && [theDelegate respondsToSelector:selector])
	{
		dispatch_async(delegateQueue, ^{ @autoreleasepool {
			
			[theDelegate udpSocket:self didReceiveData:data fromAddress:address withFilterContext:context];
		}});
	}
}

- (void)notifyDidCloseWithError:(NSError *)error
{
	LogTrace();
	
	__strong id<GCDAsyncUdpSocketDelegate> theDelegate = delegate;
	if (delegateQueue && [theDelegate respondsToSelector:@selector(udpSocketDidClose:withError:)])
	{
		dispatch_async(delegateQueue, ^{ @autoreleasepool {
			
			[theDelegate udpSocketDidClose:self withError:error];
		}});
	}
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
#pragma mark Errors
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

- (NSError *)badConfigError:(NSString *)errMsg
{
	NSDictionary *userInfo = @{NSLocalizedDescriptionKey : errMsg};
	
	return [NSError errorWithDomain:GCDAsyncUdpSocketErrorDomain
	                           code:GCDAsyncUdpSocketBadConfigError
	                       userInfo:userInfo];
}

- (NSError *)badParamError:(NSString *)errMsg
{
	NSDictionary *userInfo = @{NSLocalizedDescriptionKey : errMsg};
	
	return [NSError errorWithDomain:GCDAsyncUdpSocketErrorDomain
	                           code:GCDAsyncUdpSocketBadParamError
	                       userInfo:userInfo];
}

- (NSError *)gaiError:(int)gai_error
{
	NSString *errMsg = [NSString stringWithCString:gai_strerror(gai_error) encoding:NSASCIIStringEncoding];
	NSDictionary *userInfo = @{NSLocalizedDescriptionKey : errMsg};
	
	return [NSError errorWithDomain:@"kCFStreamErrorDomainNetDB" code:gai_error userInfo:userInfo];
}

- (NSError *)errnoErrorWithReason:(NSString *)reason
{
	NSString *errMsg = [NSString stringWithUTF8String:strerror(errno)];
	NSDictionary *userInfo;
	
	if (reason)
		userInfo = @{NSLocalizedDescriptionKey : errMsg,
					 NSLocalizedFailureReasonErrorKey : reason};
	else
		userInfo = @{NSLocalizedDescriptionKey : errMsg};
	
	return [NSError errorWithDomain:NSPOSIXErrorDomain code:errno userInfo:userInfo];
}

- (NSError *)errnoError
{
	return [self errnoErrorWithReason:nil];
}

/**
 * Returns a standard send timeout error.
**/
- (NSError *)sendTimeoutError
{
	NSString *errMsg = NSLocalizedStringWithDefaultValue(@"GCDAsyncUdpSocketSendTimeoutError",
	                                                     @"GCDAsyncUdpSocket", [NSBundle mainBundle],
	                                                     @"Send operation timed out", nil);
	
	NSDictionary *userInfo = @{NSLocalizedDescriptionKey : errMsg};
	
	return [NSError errorWithDomain:GCDAsyncUdpSocketErrorDomain
	                           code:GCDAsyncUdpSocketSendTimeoutError
	                       userInfo:userInfo];
}

- (NSError *)socketClosedError
{
	NSString *errMsg = NSLocalizedStringWithDefaultValue(@"GCDAsyncUdpSocketClosedError",
	                                                     @"GCDAsyncUdpSocket", [NSBundle mainBundle],
	                                                     @"Socket closed", nil);
	
	NSDictionary *userInfo = @{NSLocalizedDescriptionKey : errMsg};
	
	return [NSError errorWithDomain:GCDAsyncUdpSocketErrorDomain code:GCDAsyncUdpSocketClosedError userInfo:userInfo];
}

- (NSError *)otherError:(NSString *)errMsg
{
	NSDictionary *userInfo = @{NSLocalizedDescriptionKey : errMsg};
	
	return [NSError errorWithDomain:GCDAsyncUdpSocketErrorDomain
	                           code:GCDAsyncUdpSocketOtherError
	                       userInfo:userInfo];
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
#pragma mark Utilities
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

- (BOOL)preOp:(NSError **)errPtr
{
	NSAssert(dispatch_get_specific(IsOnSocketQueueOrTargetQueueKey), @"Must be dispatched on socketQueue");
	
	if (delegate == nil) // Must have delegate set
	{
		if (errPtr)
		{
			NSString *msg = @"Attempting to use socket without a delegate. Set a delegate first.";
			*errPtr = [self badConfigError:msg];
		}
		return NO;
	}
	
	if (delegateQueue == NULL) // Must have delegate queue set
	{
		if (errPtr)
		{
			NSString *msg = @"Attempting to use socket without a delegate queue. Set a delegate queue first.";
			*errPtr = [self badConfigError:msg];
		}
		return NO;
	}
	
	return YES;
}

/**
 * This method executes on a global concurrent queue.
 * When complete, it executes the given completion block on the socketQueue.
**/
- (void)asyncResolveHost:(NSString *)aHost
                    port:(uint16_t)port
     withCompletionBlock:(void (^)(NSArray *addresses, NSError *error))completionBlock
{
	LogTrace();
	
	// Check parameter(s)
	
	if (aHost == nil)
	{
		NSString *msg = @"The host param is nil. Should be domain name or IP address string.";
		NSError *error = [self badParamError:msg];
		
		// We should still use dispatch_async since this method is expected to be asynchronous
		
		dispatch_async(socketQueue, ^{ @autoreleasepool {
			
			completionBlock(nil, error);
		}});
		
		return;
	}
	
	// It's possible that the given aHost parameter is actually a NSMutableString.
	// So we want to copy it now, within this block that will be executed synchronously.
	// This way the asynchronous lookup block below doesn't have to worry about it changing.
	
	NSString *host = [aHost copy];
	
	
	dispatch_queue_t globalConcurrentQueue = dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0);
	dispatch_async(globalConcurrentQueue, ^{ @autoreleasepool {
		
		NSMutableArray *addresses = [NSMutableArray arrayWithCapacity:2];
		NSError *error = nil;
		
		if ([host isEqualToString:@"localhost"] || [host isEqualToString:@"loopback"])
		{
			// Use LOOPBACK address
			struct sockaddr_in sockaddr4;
			memset(&sockaddr4, 0, sizeof(sockaddr4));
			
			sockaddr4.sin_len         = sizeof(struct sockaddr_in);
			sockaddr4.sin_family      = AF_INET;
			sockaddr4.sin_port        = htons(port);
			sockaddr4.sin_addr.s_addr = htonl(INADDR_LOOPBACK);
			
			struct sockaddr_in6 sockaddr6;
			memset(&sockaddr6, 0, sizeof(sockaddr6));
			
			sockaddr6.sin6_len       = sizeof(struct sockaddr_in6);
			sockaddr6.sin6_family    = AF_INET6;
			sockaddr6.sin6_port      = htons(port);
			sockaddr6.sin6_addr      = in6addr_loopback;
			
			// Wrap the native address structures and add to list
			[addresses addObject:[NSData dataWithBytes:&sockaddr4 length:sizeof(sockaddr4)]];
			[addresses addObject:[NSData dataWithBytes:&sockaddr6 length:sizeof(sockaddr6)]];
		}
		else
		{
			NSString *portStr = [NSString stringWithFormat:@"%hu", port];
			
			struct addrinfo hints, *res, *res0;
			
			memset(&hints, 0, sizeof(hints));
			hints.ai_family   = PF_UNSPEC;
			hints.ai_socktype = SOCK_DGRAM;
			hints.ai_protocol = IPPROTO_UDP;
			
			int gai_error = getaddrinfo([host UTF8String], [portStr UTF8String], &hints, &res0);
			
			if (gai_error)
			{
				error = [self gaiError:gai_error];
			}
			else
			{
				for(res = res0; res; res = res->ai_next)
				{
					if (res->ai_family == AF_INET)
					{
						// Found IPv4 address
						// Wrap the native address structure and add to list
						
						[addresses addObject:[NSData dataWithBytes:res->ai_addr length:res->ai_addrlen]];
					}
					else if (res->ai_family == AF_INET6)
					{

                        // Fixes connection issues with IPv6, it is the same solution for udp socket.
                        // https://github.com/robbiehanson/CocoaAsyncSocket/issues/429#issuecomment-222477158
                        struct sockaddr_in6 *sockaddr = (struct sockaddr_in6 *)(void *)res->ai_addr;
                        in_port_t *portPtr = &sockaddr->sin6_port;
                        if ((portPtr != NULL) && (*portPtr == 0)) {
                            *portPtr = htons(port);
                        }

                        // Found IPv6 address
                        // Wrap the native address structure and add to list
						[addresses addObject:[NSData dataWithBytes:res->ai_addr length:res->ai_addrlen]];
					}
				}
				freeaddrinfo(res0);
				
				if ([addresses count] == 0)
				{
					error = [self gaiError:EAI_FAIL];
				}
			}
		}
		
        dispatch_async(self->socketQueue, ^{ @autoreleasepool {
			
			completionBlock(addresses, error);
		}});
		
	}});
}

/**
 * This method picks an address from the given list of addresses.
 * The address picked depends upon which protocols are disabled, deactived, & preferred.
 * 
 * Returns the address family (AF_INET or AF_INET6) of the picked address,
 * or AF_UNSPEC and the corresponding error is there's a problem.
**/
- (int)getAddress:(NSData **)addressPtr error:(NSError **)errorPtr fromAddresses:(NSArray *)addresses
{
	NSAssert(dispatch_get_specific(IsOnSocketQueueOrTargetQueueKey), @"Must be dispatched on socketQueue");
	NSAssert([addresses count] > 0, @"Expected at least one address");
	
	int resultAF = AF_UNSPEC;
	NSData *resultAddress = nil;
	NSError *resultError = nil;
	
	// Check for problems
	
	BOOL resolvedIPv4Address = NO;
	BOOL resolvedIPv6Address = NO;
	
	for (NSData *address in addresses)
	{
		switch ([[self class] familyFromAddress:address])
		{
			case AF_INET  : resolvedIPv4Address = YES; break;
			case AF_INET6 : resolvedIPv6Address = YES; break;
			
			default       : NSAssert(NO, @"Addresses array contains invalid address");
		}
	}
	
	BOOL isIPv4Disabled = (config & kIPv4Disabled) ? YES : NO;
	BOOL isIPv6Disabled = (config & kIPv6Disabled) ? YES : NO;
	
	if (isIPv4Disabled && !resolvedIPv6Address)
	{
		NSString *msg = @"IPv4 has been disabled and DNS lookup found no IPv6 address(es).";
		resultError = [self otherError:msg];
		
		if (addressPtr) *addressPtr = resultAddress;
		if (errorPtr) *errorPtr = resultError;
		
		return resultAF;
	}
	
	if (isIPv6Disabled && !resolvedIPv4Address)
	{
		NSString *msg = @"IPv6 has been disabled and DNS lookup found no IPv4 address(es).";
		resultError = [self otherError:msg];
		
		if (addressPtr) *addressPtr = resultAddress;
		if (errorPtr) *errorPtr = resultError;
		
		return resultAF;
	}
	
	BOOL isIPv4Deactivated = (flags & kIPv4Deactivated) ? YES : NO;
	BOOL isIPv6Deactivated = (flags & kIPv6Deactivated) ? YES : NO;
	
	if (isIPv4Deactivated && !resolvedIPv6Address)
	{
		NSString *msg = @"IPv4 has been deactivated due to bind/connect, and DNS lookup found no IPv6 address(es).";
		resultError = [self otherError:msg];
		
		if (addressPtr) *addressPtr = resultAddress;
		if (errorPtr) *errorPtr = resultError;
		
		return resultAF;
	}
	
	if (isIPv6Deactivated && !resolvedIPv4Address)
	{
		NSString *msg = @"IPv6 has been deactivated due to bind/connect, and DNS lookup found no IPv4 address(es).";
		resultError = [self otherError:msg];
		
		if (addressPtr) *addressPtr = resultAddress;
		if (errorPtr) *errorPtr = resultError;
		
		return resultAF;
	}
	
	// Extract first IPv4 and IPv6 address in list
	
	BOOL ipv4WasFirstInList = YES;
	NSData *address4 = nil;
	NSData *address6 = nil;
	
	for (NSData *address in addresses)
	{
		int af = [[self class] familyFromAddress:address];
		
		if (af == AF_INET)
		{
			if (address4 == nil)
			{
				address4 = address;
				
				if (address6)
					break;
				else
					ipv4WasFirstInList = YES;
			}
		}
		else // af == AF_INET6
		{
			if (address6 == nil)
			{
				address6 = address;
				
				if (address4)
					break;
				else
					ipv4WasFirstInList = NO;
			}
		}
	}
	
	// Determine socket type
	
	BOOL preferIPv4 = (config & kPreferIPv4) ? YES : NO;
	BOOL preferIPv6 = (config & kPreferIPv6) ? YES : NO;
	
	BOOL useIPv4 = ((preferIPv4 && address4) || (address6 == nil));
	BOOL useIPv6 = ((preferIPv6 && address6) || (address4 == nil));
	
	NSAssert(!(preferIPv4 && preferIPv6), @"Invalid config state");
	NSAssert(!(useIPv4 && useIPv6), @"Invalid logic");
	
	if (useIPv4 || (!useIPv6 && ipv4WasFirstInList))
	{
		resultAF = AF_INET;
		resultAddress = address4;
	}
	else
	{
		resultAF = AF_INET6;
		resultAddress = address6;
	}
	
	if (addressPtr) *addressPtr = resultAddress;
	if (errorPtr) *errorPtr = resultError;
		
	return resultAF;
}

/**
 * Finds the address(es) of an interface description.
 * An inteface description may be an interface name (en0, en1, lo0) or corresponding IP (192.168.4.34).
**/
- (void)convertIntefaceDescription:(NSString *)interfaceDescription
                              port:(uint16_t)port
                      intoAddress4:(NSData **)interfaceAddr4Ptr
                          address6:(NSData **)interfaceAddr6Ptr
{
	NSData *addr4 = nil;
	NSData *addr6 = nil;
	
	if (interfaceDescription == nil)
	{
		// ANY address
		
		struct sockaddr_in sockaddr4;
		memset(&sockaddr4, 0, sizeof(sockaddr4));
		
		sockaddr4.sin_len         = sizeof(sockaddr4);
		sockaddr4.sin_family      = AF_INET;
		sockaddr4.sin_port        = htons(port);
		sockaddr4.sin_addr.s_addr = htonl(INADDR_ANY);
		
		struct sockaddr_in6 sockaddr6;
		memset(&sockaddr6, 0, sizeof(sockaddr6));
		
		sockaddr6.sin6_len       = sizeof(sockaddr6);
		sockaddr6.sin6_family    = AF_INET6;
		sockaddr6.sin6_port      = htons(port);
		sockaddr6.sin6_addr      = in6addr_any;
		
		addr4 = [NSData dataWithBytes:&sockaddr4 length:sizeof(sockaddr4)];
		addr6 = [NSData dataWithBytes:&sockaddr6 length:sizeof(sockaddr6)];
	}
	else if ([interfaceDescription isEqualToString:@"localhost"] ||
	         [interfaceDescription isEqualToString:@"loopback"])
	{
		// LOOPBACK address
		
		struct sockaddr_in sockaddr4;
		memset(&sockaddr4, 0, sizeof(sockaddr4));
		
		sockaddr4.sin_len         = sizeof(struct sockaddr_in);
		sockaddr4.sin_family      = AF_INET;
		sockaddr4.sin_port        = htons(port);
		sockaddr4.sin_addr.s_addr = htonl(INADDR_LOOPBACK);
		
		struct sockaddr_in6 sockaddr6;
		memset(&sockaddr6, 0, sizeof(sockaddr6));
		
		sockaddr6.sin6_len       = sizeof(struct sockaddr_in6);
		sockaddr6.sin6_family    = AF_INET6;
		sockaddr6.sin6_port      = htons(port);
		sockaddr6.sin6_addr      = in6addr_loopback;
		
		addr4 = [NSData dataWithBytes:&sockaddr4 length:sizeof(sockaddr4)];
		addr6 = [NSData dataWithBytes:&sockaddr6 length:sizeof(sockaddr6)];
	}
	else
	{
		const char *iface = [interfaceDescription UTF8String];
		
		struct ifaddrs *addrs;
		const struct ifaddrs *cursor;
		
		if ((getifaddrs(&addrs) == 0))
		{
			cursor = addrs;
			while (cursor != NULL)
			{
				if ((addr4 == nil) && (cursor->ifa_addr->sa_family == AF_INET))
				{
					// IPv4
					
					struct sockaddr_in *addr = (struct sockaddr_in *)(void *)cursor->ifa_addr;
					
					if (strcmp(cursor->ifa_name, iface) == 0)
					{
						// Name match
						
						struct sockaddr_in nativeAddr4 = *addr;
						nativeAddr4.sin_port = htons(port);
						
						addr4 = [NSData dataWithBytes:&nativeAddr4 length:sizeof(nativeAddr4)];
					}
					else
					{
						char ip[INET_ADDRSTRLEN];
						
						const char *conversion;
						conversion = inet_ntop(AF_INET, &addr->sin_addr, ip, sizeof(ip));
						
						if ((conversion != NULL) && (strcmp(ip, iface) == 0))
						{
							// IP match
							
							struct sockaddr_in nativeAddr4 = *addr;
							nativeAddr4.sin_port = htons(port);
							
							addr4 = [NSData dataWithBytes:&nativeAddr4 length:sizeof(nativeAddr4)];
						}
					}
				}
				else if ((addr6 == nil) && (cursor->ifa_addr->sa_family == AF_INET6))
				{
					// IPv6
					
					const struct sockaddr_in6 *addr = (const struct sockaddr_in6 *)(const void *)cursor->ifa_addr;
					
					if (strcmp(cursor->ifa_name, iface) == 0)
					{
						// Name match
						
						struct sockaddr_in6 nativeAddr6 = *addr;
						nativeAddr6.sin6_port = htons(port);
						
						addr6 = [NSData dataWithBytes:&nativeAddr6 length:sizeof(nativeAddr6)];
					}
					else
					{
						char ip[INET6_ADDRSTRLEN];
						
						const char *conversion;
						conversion = inet_ntop(AF_INET6, &addr->sin6_addr, ip, sizeof(ip));
						
						if ((conversion != NULL) && (strcmp(ip, iface) == 0))
						{
							// IP match
							
							struct sockaddr_in6 nativeAddr6 = *addr;
							nativeAddr6.sin6_port = htons(port);
							
							addr6 = [NSData dataWithBytes:&nativeAddr6 length:sizeof(nativeAddr6)];
						}
					}
				}
				
				cursor = cursor->ifa_next;
			}
			
			freeifaddrs(addrs);
		}
	}
	
	if (interfaceAddr4Ptr) *interfaceAddr4Ptr = addr4;
	if (interfaceAddr6Ptr) *interfaceAddr6Ptr = addr6;
}

/**
 * Converts a numeric hostname into its corresponding address.
 * The hostname is expected to be an IPv4 or IPv6 address represented as a human-readable string. (e.g. 192.168.4.34)
**/
- (void)convertNumericHost:(NSString *)numericHost
                      port:(uint16_t)port
              intoAddress4:(NSData **)addr4Ptr
                  address6:(NSData **)addr6Ptr
{
	NSData *addr4 = nil;
	NSData *addr6 = nil;
	
	if (numericHost)
	{
		NSString *portStr = [NSString stringWithFormat:@"%hu", port];
		
		struct addrinfo hints, *res, *res0;
		
		memset(&hints, 0, sizeof(hints));
		hints.ai_family   = PF_UNSPEC;
		hints.ai_socktype = SOCK_DGRAM;
		hints.ai_protocol = IPPROTO_UDP;
		hints.ai_flags    = AI_NUMERICHOST; // No name resolution should be attempted
		
		if (getaddrinfo([numericHost UTF8String], [portStr UTF8String], &hints, &res0) == 0)
		{
			for (res = res0; res; res = res->ai_next)
			{
				if ((addr4 == nil) && (res->ai_family == AF_INET))
				{
					// Found IPv4 address
					// Wrap the native address structure
					addr4 = [NSData dataWithBytes:res->ai_addr length:res->ai_addrlen];
				}
				else if ((addr6 == nil) && (res->ai_family == AF_INET6))
				{
					// Found IPv6 address
					// Wrap the native address structure
					addr6 = [NSData dataWithBytes:res->ai_addr length:res->ai_addrlen];
				}
			}
			freeaddrinfo(res0);
		}
	}
	
	if (addr4Ptr) *addr4Ptr = addr4;
	if (addr6Ptr) *addr6Ptr = addr6;
}

- (BOOL)isConnectedToAddress4:(NSData *)someAddr4
{
	NSAssert(dispatch_get_specific(IsOnSocketQueueOrTargetQueueKey), @"Must be dispatched on socketQueue");
	NSAssert(flags & kDidConnect, @"Not connected");
	NSAssert(cachedConnectedAddress, @"Expected cached connected address");
	
	if (cachedConnectedFamily != AF_INET)
	{
		return NO;
	}
	
	const struct sockaddr_in *sSockaddr4 = (const struct sockaddr_in *)[someAddr4 bytes];
	const struct sockaddr_in *cSockaddr4 = (const struct sockaddr_in *)[cachedConnectedAddress bytes];
	
	if (memcmp(&sSockaddr4->sin_addr, &cSockaddr4->sin_addr, sizeof(struct in_addr)) != 0)
	{
		return NO;
	}
	if (memcmp(&sSockaddr4->sin_port, &cSockaddr4->sin_port, sizeof(in_port_t)) != 0)
	{
		return NO;
	}
	
	return YES;
}

- (BOOL)isConnectedToAddress6:(NSData *)someAddr6
{
	NSAssert(dispatch_get_specific(IsOnSocketQueueOrTargetQueueKey), @"Must be dispatched on socketQueue");
	NSAssert(flags & kDidConnect, @"Not connected");
	NSAssert(cachedConnectedAddress, @"Expected cached connected address");
	
	if (cachedConnectedFamily != AF_INET6)
	{
		return NO;
	}
	
	const struct sockaddr_in6 *sSockaddr6 = (const struct sockaddr_in6 *)[someAddr6 bytes];
	const struct sockaddr_in6 *cSockaddr6 = (const struct sockaddr_in6 *)[cachedConnectedAddress bytes];
	
	if (memcmp(&sSockaddr6->sin6_addr, &cSockaddr6->sin6_addr, sizeof(struct in6_addr)) != 0)
	{
		return NO;
	}
	if (memcmp(&sSockaddr6->sin6_port, &cSockaddr6->sin6_port, sizeof(in_port_t)) != 0)
	{
		return NO;
	}
	
	return YES;
}

- (unsigned int)indexOfInterfaceAddr4:(NSData *)interfaceAddr4
{
	if (interfaceAddr4 == nil)
		return 0;
	if ([interfaceAddr4 length] != sizeof(struct sockaddr_in))
		return 0;
	
	int result = 0;
	const struct sockaddr_in *ifaceAddr = (const struct sockaddr_in *)[interfaceAddr4 bytes];
	
	struct ifaddrs *addrs;
	const struct ifaddrs *cursor;
	
	if ((getifaddrs(&addrs) == 0))
	{
		cursor = addrs;
		while (cursor != NULL)
		{
			if (cursor->ifa_addr->sa_family == AF_INET)
			{
				// IPv4
				
				const struct sockaddr_in *addr = (const struct sockaddr_in *)(const void *)cursor->ifa_addr;
				
				if (memcmp(&addr->sin_addr, &ifaceAddr->sin_addr, sizeof(struct in_addr)) == 0)
				{
					result = if_nametoindex(cursor->ifa_name);
					break;
				}
			}
			
			cursor = cursor->ifa_next;
		}
		
		freeifaddrs(addrs);
	}
	
	return result;
}

- (unsigned int)indexOfInterfaceAddr6:(NSData *)interfaceAddr6
{
	if (interfaceAddr6 == nil)
		return 0;
	if ([interfaceAddr6 length] != sizeof(struct sockaddr_in6))
		return 0;
	
	int result = 0;
	const struct sockaddr_in6 *ifaceAddr = (const struct sockaddr_in6 *)[interfaceAddr6 bytes];
	
	struct ifaddrs *addrs;
	const struct ifaddrs *cursor;
	
	if ((getifaddrs(&addrs) == 0))
	{
		cursor = addrs;
		while (cursor != NULL)
		{
			if (cursor->ifa_addr->sa_family == AF_INET6)
			{
				// IPv6
				
				const struct sockaddr_in6 *addr = (const struct sockaddr_in6 *)(const void *)cursor->ifa_addr;
				
				if (memcmp(&addr->sin6_addr, &ifaceAddr->sin6_addr, sizeof(struct in6_addr)) == 0)
				{
					result = if_nametoindex(cursor->ifa_name);
					break;
				}
			}
			
			cursor = cursor->ifa_next;
		}
		
		freeifaddrs(addrs);
	}
	
	return result;
}

- (void)setupSendAndReceiveSourcesForSocket4
{
	LogTrace();
	NSAssert(dispatch_get_specific(IsOnSocketQueueOrTargetQueueKey), @"Must be dispatched on socketQueue");
	
	send4Source = dispatch_source_create(DISPATCH_SOURCE_TYPE_WRITE, socket4FD, 0, socketQueue);
	receive4Source = dispatch_source_create(DISPATCH_SOURCE_TYPE_READ, socket4FD, 0, socketQueue);
	
	// Setup event handlers
	
	dispatch_source_set_event_handler(send4Source, ^{ @autoreleasepool {
		
		LogVerbose(@"send4EventBlock");
		LogVerbose(@"dispatch_source_get_data(send4Source) = %lu", dispatch_source_get_data(send4Source));
		
        self->flags |= kSock4CanAcceptBytes;
		
		// If we're ready to send data, do so immediately.
		// Otherwise pause the send source or it will continue to fire over and over again.
		
        if (self->currentSend == nil)
		{
			LogVerbose(@"Nothing to send");
			[self suspendSend4Source];
		}
        else if (self->currentSend->resolveInProgress)
		{
			LogVerbose(@"currentSend - waiting for address resolve");
			[self suspendSend4Source];
		}
        else if (self->currentSend->filterInProgress)
		{
			LogVerbose(@"currentSend - waiting on sendFilter");
			[self suspendSend4Source];
		}
		else
		{
			[self doSend];
		}
		
	}});
	
	dispatch_source_set_event_handler(receive4Source, ^{ @autoreleasepool {
		
		LogVerbose(@"receive4EventBlock");
		
        self->socket4FDBytesAvailable = dispatch_source_get_data(self->receive4Source);
		LogVerbose(@"socket4FDBytesAvailable: %lu", socket4FDBytesAvailable);
		
        if (self->socket4FDBytesAvailable > 0)
			[self doReceive];
		else
			[self doReceiveEOF];
		
	}});
	
	// Setup cancel handlers
	
	__block int socketFDRefCount = 2;
	
	int theSocketFD = socket4FD;
	
	#if !OS_OBJECT_USE_OBJC
	dispatch_source_t theSendSource = send4Source;
	dispatch_source_t theReceiveSource = receive4Source;
	#endif
	
	dispatch_source_set_cancel_handler(send4Source, ^{
		
		LogVerbose(@"send4CancelBlock");
		
		#if !OS_OBJECT_USE_OBJC
		LogVerbose(@"dispatch_release(send4Source)");
		dispatch_release(theSendSource);
		#endif
		
		if (--socketFDRefCount == 0)
		{
			LogVerbose(@"close(socket4FD)");
			close(theSocketFD);
		}
	});
	
	dispatch_source_set_cancel_handler(receive4Source, ^{
		
		LogVerbose(@"receive4CancelBlock");
		
		#if !OS_OBJECT_USE_OBJC
		LogVerbose(@"dispatch_release(receive4Source)");
		dispatch_release(theReceiveSource);
		#endif
		
		if (--socketFDRefCount == 0)
		{
			LogVerbose(@"close(socket4FD)");
			close(theSocketFD);
		}
	});
	
	// We will not be able to receive until the socket is bound to a port,
	// either explicitly via bind, or implicitly by connect or by sending data.
	// 
	// But we should be able to send immediately.
	
	socket4FDBytesAvailable = 0;
	flags |= kSock4CanAcceptBytes;
	
	flags |= kSend4SourceSuspended;
	flags |= kReceive4SourceSuspended;
}

- (void)setupSendAndReceiveSourcesForSocket6
{
	LogTrace();
	NSAssert(dispatch_get_specific(IsOnSocketQueueOrTargetQueueKey), @"Must be dispatched on socketQueue");
	
	send6Source = dispatch_source_create(DISPATCH_SOURCE_TYPE_WRITE, socket6FD, 0, socketQueue);
	receive6Source = dispatch_source_create(DISPATCH_SOURCE_TYPE_READ, socket6FD, 0, socketQueue);
	
	// Setup event handlers
	
	dispatch_source_set_event_handler(send6Source, ^{ @autoreleasepool {
		
		LogVerbose(@"send6EventBlock");
		LogVerbose(@"dispatch_source_get_data(send6Source) = %lu", dispatch_source_get_data(send6Source));
		
        self->flags |= kSock6CanAcceptBytes;
		
		// If we're ready to send data, do so immediately.
		// Otherwise pause the send source or it will continue to fire over and over again.
		
        if (self->currentSend == nil)
		{
			LogVerbose(@"Nothing to send");
			[self suspendSend6Source];
		}
        else if (self->currentSend->resolveInProgress)
		{
			LogVerbose(@"currentSend - waiting for address resolve");
			[self suspendSend6Source];
		}
        else if (self->currentSend->filterInProgress)
		{
			LogVerbose(@"currentSend - waiting on sendFilter");
			[self suspendSend6Source];
		}
		else
		{
			[self doSend];
		}
		
	}});
	
	dispatch_source_set_event_handler(receive6Source, ^{ @autoreleasepool {
		
		LogVerbose(@"receive6EventBlock");
		
        self->socket6FDBytesAvailable = dispatch_source_get_data(self->receive6Source);
		LogVerbose(@"socket6FDBytesAvailable: %lu", socket6FDBytesAvailable);
		
        if (self->socket6FDBytesAvailable > 0)
			[self doReceive];
		else
			[self doReceiveEOF];
		
	}});
	
	// Setup cancel handlers
	
	__block int socketFDRefCount = 2;
	
	int theSocketFD = socket6FD;
	
	#if !OS_OBJECT_USE_OBJC
	dispatch_source_t theSendSource = send6Source;
	dispatch_source_t theReceiveSource = receive6Source;
	#endif
	
	dispatch_source_set_cancel_handler(send6Source, ^{
		
		LogVerbose(@"send6CancelBlock");
		
		#if !OS_OBJECT_USE_OBJC
		LogVerbose(@"dispatch_release(send6Source)");
		dispatch_release(theSendSource);
		#endif
		
		if (--socketFDRefCount == 0)
		{
			LogVerbose(@"close(socket6FD)");
			close(theSocketFD);
		}
	});
	
	dispatch_source_set_cancel_handler(receive6Source, ^{
		
		LogVerbose(@"receive6CancelBlock");
		
		#if !OS_OBJECT_USE_OBJC
		LogVerbose(@"dispatch_release(receive6Source)");
		dispatch_release(theReceiveSource);
		#endif
		
		if (--socketFDRefCount == 0)
		{
			LogVerbose(@"close(socket6FD)");
			close(theSocketFD);
		}
	});
	
	// We will not be able to receive until the socket is bound to a port,
	// either explicitly via bind, or implicitly by connect or by sending data.
	// 
	// But we should be able to send immediately.
	
	socket6FDBytesAvailable = 0;
	flags |= kSock6CanAcceptBytes;
	
	flags |= kSend6SourceSuspended;
	flags |= kReceive6SourceSuspended;
}

- (BOOL)createSocket4:(BOOL)useIPv4 socket6:(BOOL)useIPv6 error:(NSError * __autoreleasing *)errPtr
{
	LogTrace();
	
	NSAssert(dispatch_get_specific(IsOnSocketQueueOrTargetQueueKey), @"Must be dispatched on socketQueue");
	NSAssert(((flags & kDidCreateSockets) == 0), @"Sockets have already been created");
	
	// CreateSocket Block
	// This block will be invoked below.
	
	int(^createSocket)(int) = ^int (int domain) {
		
		int socketFD = socket(domain, SOCK_DGRAM, 0);
		
		if (socketFD == SOCKET_NULL)
		{
			if (errPtr)
				*errPtr = [self errnoErrorWithReason:@"Error in socket() function"];
			
			return SOCKET_NULL;
		}
		
		int status;
		
		// Set socket options
		
		status = fcntl(socketFD, F_SETFL, O_NONBLOCK);
		if (status == -1)
		{
			if (errPtr)
				*errPtr = [self errnoErrorWithReason:@"Error enabling non-blocking IO on socket (fcntl)"];
			
			close(socketFD);
			return SOCKET_NULL;
		}
		
		int reuseaddr = 1;
		status = setsockopt(socketFD, SOL_SOCKET, SO_REUSEADDR, &reuseaddr, sizeof(reuseaddr));
		if (status == -1)
		{
			if (errPtr)
				*errPtr = [self errnoErrorWithReason:@"Error enabling address reuse (setsockopt)"];
			
			close(socketFD);
			return SOCKET_NULL;
		}
		
		int nosigpipe = 1;
		status = setsockopt(socketFD, SOL_SOCKET, SO_NOSIGPIPE, &nosigpipe, sizeof(nosigpipe));
		if (status == -1)
		{
			if (errPtr)
				*errPtr = [self errnoErrorWithReason:@"Error disabling sigpipe (setsockopt)"];
			
			close(socketFD);
			return SOCKET_NULL;
		}
        
        /**
         * The theoretical maximum size of any IPv4 UDP packet is UINT16_MAX = 65535.
         * The theoretical maximum size of any IPv6 UDP packet is UINT32_MAX = 4294967295.
         *
         * The default maximum size of the UDP buffer in iOS is 9216 bytes.
         *
         * This is the reason of #222(GCD does not necessarily return the size of an entire UDP packet) and
         *  #535(GCDAsyncUDPSocket can not send data when data is greater than 9K)
         *
         *
         * Enlarge the maximum size of UDP packet.
         * I can not ensure the protocol type now so that the max size is set to 65535 :)
         **/
      
        status = setsockopt(socketFD, SOL_SOCKET, SO_SNDBUF, (const char*)&self->maxSendSize, sizeof(int));
        if (status == -1)
        {
            if (errPtr)
                *errPtr = [self errnoErrorWithReason:@"Error setting send buffer size (setsockopt)"];
            close(socketFD);
            return SOCKET_NULL;
        }
        
        status = setsockopt(socketFD, SOL_SOCKET, SO_RCVBUF, (const char*)&self->maxSendSize, sizeof(int));
        if (status == -1)
        {
            if (errPtr)
                *errPtr = [self errnoErrorWithReason:@"Error setting receive buffer size (setsockopt)"];
            close(socketFD);
            return SOCKET_NULL;
        }

		
		return socketFD;
	};
	
	// Create sockets depending upon given configuration.
	
	if (useIPv4)
	{
		LogVerbose(@"Creating IPv4 socket");
		
		socket4FD = createSocket(AF_INET);
		if (socket4FD == SOCKET_NULL)
		{
			// errPtr set in local createSocket() block
			return NO;
		}
	}
	
	if (useIPv6)
	{
		LogVerbose(@"Creating IPv6 socket");
		
		socket6FD = createSocket(AF_INET6);
		if (socket6FD == SOCKET_NULL)
		{
			// errPtr set in local createSocket() block
			
			if (socket4FD != SOCKET_NULL)
			{
				close(socket4FD);
				socket4FD = SOCKET_NULL;
			}
			
			return NO;
		}
	}
	
	// Setup send and receive sources
	
	if (useIPv4)
		[self setupSendAndReceiveSourcesForSocket4];
	if (useIPv6)
		[self setupSendAndReceiveSourcesForSocket6];
	
	flags |= kDidCreateSockets;
	return YES;
}

- (BOOL)createSockets:(NSError **)errPtr
{
	LogTrace();
	
	BOOL useIPv4 = [self isIPv4Enabled];
	BOOL useIPv6 = [self isIPv6Enabled];
	
	return [self createSocket4:useIPv4 socket6:useIPv6 error:errPtr];
}

- (void)suspendSend4Source
{
	if (send4Source && !(flags & kSend4SourceSuspended))
	{
		LogVerbose(@"dispatch_suspend(send4Source)");
		
		dispatch_suspend(send4Source);
		flags |= kSend4SourceSuspended;
	}
}

- (void)suspendSend6Source
{
	if (send6Source && !(flags & kSend6SourceSuspended))
	{
		LogVerbose(@"dispatch_suspend(send6Source)");
		
		dispatch_suspend(send6Source);
		flags |= kSend6SourceSuspended;
	}
}

- (void)resumeSend4Source
{
	if (send4Source && (flags & kSend4SourceSuspended))
	{
		LogVerbose(@"dispatch_resume(send4Source)");
		
		dispatch_resume(send4Source);
		flags &= ~kSend4SourceSuspended;
	}
}

- (void)resumeSend6Source
{
	if (send6Source && (flags & kSend6SourceSuspended))
	{
		LogVerbose(@"dispatch_resume(send6Source)");
		
		dispatch_resume(send6Source);
		flags &= ~kSend6SourceSuspended;
	}
}

- (void)suspendReceive4Source
{
	if (receive4Source && !(flags & kReceive4SourceSuspended))
	{
		LogVerbose(@"dispatch_suspend(receive4Source)");
		
		dispatch_suspend(receive4Source);
		flags |= kReceive4SourceSuspended;
	}
}

- (void)suspendReceive6Source
{
	if (receive6Source && !(flags & kReceive6SourceSuspended))
	{
		LogVerbose(@"dispatch_suspend(receive6Source)");
		
		dispatch_suspend(receive6Source);
		flags |= kReceive6SourceSuspended;
	}
}

- (void)resumeReceive4Source
{
	if (receive4Source && (flags & kReceive4SourceSuspended))
	{
		LogVerbose(@"dispatch_resume(receive4Source)");
		
		dispatch_resume(receive4Source);
		flags &= ~kReceive4SourceSuspended;
	}
}

- (void)resumeReceive6Source
{
	if (receive6Source && (flags & kReceive6SourceSuspended))
	{
		LogVerbose(@"dispatch_resume(receive6Source)");
		
		dispatch_resume(receive6Source);
		flags &= ~kReceive6SourceSuspended;
	}
}

- (void)closeSocket4
{
	if (socket4FD != SOCKET_NULL)
	{
		LogVerbose(@"dispatch_source_cancel(send4Source)");
		dispatch_source_cancel(send4Source);
		
		LogVerbose(@"dispatch_source_cancel(receive4Source)");
		dispatch_source_cancel(receive4Source);
		
		// For some crazy reason (in my opinion), cancelling a dispatch source doesn't
		// invoke the cancel handler if the dispatch source is paused.
		// So we have to unpause the source if needed.
		// This allows the cancel handler to be run, which in turn releases the source and closes the socket.
		
		[self resumeSend4Source];
		[self resumeReceive4Source];
		
		// The sockets will be closed by the cancel handlers of the corresponding source
		
		send4Source = NULL;
		receive4Source = NULL;
		
		socket4FD = SOCKET_NULL;
		
		// Clear socket states
		
		socket4FDBytesAvailable = 0;
		flags &= ~kSock4CanAcceptBytes;
		
		// Clear cached info
		
		cachedLocalAddress4 = nil;
		cachedLocalHost4 = nil;
		cachedLocalPort4 = 0;
	}
}

- (void)closeSocket6
{
	if (socket6FD != SOCKET_NULL)
	{
		LogVerbose(@"dispatch_source_cancel(send6Source)");
		dispatch_source_cancel(send6Source);
		
		LogVerbose(@"dispatch_source_cancel(receive6Source)");
		dispatch_source_cancel(receive6Source);
		
		// For some crazy reason (in my opinion), cancelling a dispatch source doesn't
		// invoke the cancel handler if the dispatch source is paused.
		// So we have to unpause the source if needed.
		// This allows the cancel handler to be run, which in turn releases the source and closes the socket.
		
		[self resumeSend6Source];
		[self resumeReceive6Source];
		
		send6Source = NULL;
		receive6Source = NULL;
		
		// The sockets will be closed by the cancel handlers of the corresponding source
		
		socket6FD = SOCKET_NULL;
		
		// Clear socket states
		
		socket6FDBytesAvailable = 0;
		flags &= ~kSock6CanAcceptBytes;
		
		// Clear cached info
		
		cachedLocalAddress6 = nil;
		cachedLocalHost6 = nil;
		cachedLocalPort6 = 0;
	}
}

- (void)closeSockets
{
	[self closeSocket4];
	[self closeSocket6];
	
	flags &= ~kDidCreateSockets;
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
#pragma mark Diagnostics
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

- (BOOL)getLocalAddress:(NSData **)dataPtr
                   host:(NSString **)hostPtr
                   port:(uint16_t *)portPtr
              forSocket:(int)socketFD
             withFamily:(int)socketFamily
{
	
	NSData   *data = nil;
	NSString *host = nil;
	uint16_t  port = 0;
	
	if (socketFamily == AF_INET)
	{
		struct sockaddr_in sockaddr4;
		socklen_t sockaddr4len = sizeof(sockaddr4);
		
		if (getsockname(socketFD, (struct sockaddr *)&sockaddr4, &sockaddr4len) == 0)
		{
			data = [NSData dataWithBytes:&sockaddr4 length:sockaddr4len];
			host = [[self class] hostFromSockaddr4:&sockaddr4];
			port = [[self class] portFromSockaddr4:&sockaddr4];
		}
		else
		{
			LogWarn(@"Error in getsockname: %@", [self errnoError]);
		}
	}
	else if (socketFamily == AF_INET6)
	{
		struct sockaddr_in6 sockaddr6;
		socklen_t sockaddr6len = sizeof(sockaddr6);
		
		if (getsockname(socketFD, (struct sockaddr *)&sockaddr6, &sockaddr6len) == 0)
		{
			data = [NSData dataWithBytes:&sockaddr6 length:sockaddr6len];
			host = [[self class] hostFromSockaddr6:&sockaddr6];
			port = [[self class] portFromSockaddr6:&sockaddr6];
		}
		else
		{
			LogWarn(@"Error in getsockname: %@", [self errnoError]);
		}
	}
	
	if (dataPtr) *dataPtr = data;
	if (hostPtr) *hostPtr = host;
	if (portPtr) *portPtr = port;
	
	return (data != nil);
}

- (void)maybeUpdateCachedLocalAddress4Info
{
	NSAssert(dispatch_get_specific(IsOnSocketQueueOrTargetQueueKey), @"Must be dispatched on socketQueue");
	
	if ( cachedLocalAddress4 || ((flags & kDidBind) == 0) || (socket4FD == SOCKET_NULL) )
	{
		return;
	}
	
	NSData *address = nil;
	NSString *host = nil;
	uint16_t port = 0;
	
	if ([self getLocalAddress:&address host:&host port:&port forSocket:socket4FD withFamily:AF_INET])
	{
		
		cachedLocalAddress4 = address;
		cachedLocalHost4 = host;
		cachedLocalPort4 = port;
	}
}

- (void)maybeUpdateCachedLocalAddress6Info
{
	NSAssert(dispatch_get_specific(IsOnSocketQueueOrTargetQueueKey), @"Must be dispatched on socketQueue");
	
	if ( cachedLocalAddress6 || ((flags & kDidBind) == 0) || (socket6FD == SOCKET_NULL) )
	{
		return;
	}
	
	NSData *address = nil;
	NSString *host = nil;
	uint16_t port = 0;
	
	if ([self getLocalAddress:&address host:&host port:&port forSocket:socket6FD withFamily:AF_INET6])
	{
		
		cachedLocalAddress6 = address;
		cachedLocalHost6 = host;
		cachedLocalPort6 = port;
	}
}

- (NSData *)localAddress
{
	__block NSData *result = nil;
	
	dispatch_block_t block = ^{
		
        if (self->socket4FD != SOCKET_NULL)
		{
			[self maybeUpdateCachedLocalAddress4Info];
            result = self->cachedLocalAddress4;
		}
		else
		{
			[self maybeUpdateCachedLocalAddress6Info];
            result = self->cachedLocalAddress6;
		}
		
	};
	
	if (dispatch_get_specific(IsOnSocketQueueOrTargetQueueKey))
		block();
	else
		dispatch_sync(socketQueue, AutoreleasedBlock(block));
	
	return result;
}

- (NSString *)localHost
{
	__block NSString *result = nil;
	
	dispatch_block_t block = ^{
		
        if (self->socket4FD != SOCKET_NULL)
		{
			[self maybeUpdateCachedLocalAddress4Info];
            result = self->cachedLocalHost4;
		}
		else
		{
			[self maybeUpdateCachedLocalAddress6Info];
            result = self->cachedLocalHost6;
		}
	};
	
	if (dispatch_get_specific(IsOnSocketQueueOrTargetQueueKey))
		block();
	else
		dispatch_sync(socketQueue, AutoreleasedBlock(block));
	
	return result;
}

- (uint16_t)localPort
{
	__block uint16_t result = 0;
	
	dispatch_block_t block = ^{
		
        if (self->socket4FD != SOCKET_NULL)
		{
			[self maybeUpdateCachedLocalAddress4Info];
            result = self->cachedLocalPort4;
		}
		else
		{
			[self maybeUpdateCachedLocalAddress6Info];
            result = self->cachedLocalPort6;
		}
	};
	
	if (dispatch_get_specific(IsOnSocketQueueOrTargetQueueKey))
		block();
	else
		dispatch_sync(socketQueue, AutoreleasedBlock(block));
	
	return result;
}

- (NSData *)localAddress_IPv4
{
	__block NSData *result = nil;
	
	dispatch_block_t block = ^{
		
		[self maybeUpdateCachedLocalAddress4Info];
        result = self->cachedLocalAddress4;
	};
	
	if (dispatch_get_specific(IsOnSocketQueueOrTargetQueueKey))
		block();
	else
		dispatch_sync(socketQueue, AutoreleasedBlock(block));
	
	return result;
}

- (NSString *)localHost_IPv4
{
	__block NSString *result = nil;
	
	dispatch_block_t block = ^{
		
		[self maybeUpdateCachedLocalAddress4Info];
        result = self->cachedLocalHost4;
	};
	
	if (dispatch_get_specific(IsOnSocketQueueOrTargetQueueKey))
		block();
	else
		dispatch_sync(socketQueue, AutoreleasedBlock(block));
	
	return result;
}

- (uint16_t)localPort_IPv4
{
	__block uint16_t result = 0;
	
	dispatch_block_t block = ^{
		
		[self maybeUpdateCachedLocalAddress4Info];
        result = self->cachedLocalPort4;
	};
	
	if (dispatch_get_specific(IsOnSocketQueueOrTargetQueueKey))
		block();
	else
		dispatch_sync(socketQueue, AutoreleasedBlock(block));
	
	return result;
}

- (NSData *)localAddress_IPv6
{
	__block NSData *result = nil;
	
	dispatch_block_t block = ^{
		
		[self maybeUpdateCachedLocalAddress6Info];
        result = self->cachedLocalAddress6;
	};
	
	if (dispatch_get_specific(IsOnSocketQueueOrTargetQueueKey))
		block();
	else
		dispatch_sync(socketQueue, AutoreleasedBlock(block));
	
	return result;
}

- (NSString *)localHost_IPv6
{
	__block NSString *result = nil;
	
	dispatch_block_t block = ^{
		
		[self maybeUpdateCachedLocalAddress6Info];
        result = self->cachedLocalHost6;
	};
	
	if (dispatch_get_specific(IsOnSocketQueueOrTargetQueueKey))
		block();
	else
		dispatch_sync(socketQueue, AutoreleasedBlock(block));
	
	return result;
}

- (uint16_t)localPort_IPv6
{
	__block uint16_t result = 0;
	
	dispatch_block_t block = ^{
		
		[self maybeUpdateCachedLocalAddress6Info];
        result = self->cachedLocalPort6;
	};
	
	if (dispatch_get_specific(IsOnSocketQueueOrTargetQueueKey))
		block();
	else
		dispatch_sync(socketQueue, AutoreleasedBlock(block));
	
	return result;
}

- (void)maybeUpdateCachedConnectedAddressInfo
{
	NSAssert(dispatch_get_specific(IsOnSocketQueueOrTargetQueueKey), @"Must be dispatched on socketQueue");
	
	if (cachedConnectedAddress || (flags & kDidConnect) == 0)
	{
		return;
	}
	
	NSData *data = nil;
	NSString *host = nil;
	uint16_t port = 0;
	int family = AF_UNSPEC;
	
	if (socket4FD != SOCKET_NULL)
	{
		struct sockaddr_in sockaddr4;
		socklen_t sockaddr4len = sizeof(sockaddr4);
		
		if (getpeername(socket4FD, (struct sockaddr *)&sockaddr4, &sockaddr4len) == 0)
		{
			data = [NSData dataWithBytes:&sockaddr4 length:sockaddr4len];
			host = [[self class] hostFromSockaddr4:&sockaddr4];
			port = [[self class] portFromSockaddr4:&sockaddr4];
			family = AF_INET;
		}
		else
		{
			LogWarn(@"Error in getpeername: %@", [self errnoError]);
		}
	}
	else if (socket6FD != SOCKET_NULL)
	{
		struct sockaddr_in6 sockaddr6;
		socklen_t sockaddr6len = sizeof(sockaddr6);
		
		if (getpeername(socket6FD, (struct sockaddr *)&sockaddr6, &sockaddr6len) == 0)
		{
			data = [NSData dataWithBytes:&sockaddr6 length:sockaddr6len];
			host = [[self class] hostFromSockaddr6:&sockaddr6];
			port = [[self class] portFromSockaddr6:&sockaddr6];
			family = AF_INET6;
		}
		else
		{
			LogWarn(@"Error in getpeername: %@", [self errnoError]);
		}
	}
	
	
	cachedConnectedAddress = data;
	cachedConnectedHost    = host;
	cachedConnectedPort    = port;
	cachedConnectedFamily  = family;
}

- (NSData *)connectedAddress
{
	__block NSData *result = nil;
	
	dispatch_block_t block = ^{
		
		[self maybeUpdateCachedConnectedAddressInfo];
        result = self->cachedConnectedAddress;
	};
	
	if (dispatch_get_specific(IsOnSocketQueueOrTargetQueueKey))
		block();
	else
		dispatch_sync(socketQueue, AutoreleasedBlock(block));
	
	return result;
}

- (NSString *)connectedHost
{
	__block NSString *result = nil;
	
	dispatch_block_t block = ^{
		
		[self maybeUpdateCachedConnectedAddressInfo];
        result = self->cachedConnectedHost;
	};
	
	if (dispatch_get_specific(IsOnSocketQueueOrTargetQueueKey))
		block();
	else
		dispatch_sync(socketQueue, AutoreleasedBlock(block));
	
	return result;
}

- (uint16_t)connectedPort
{
	__block uint16_t result = 0;
	
	dispatch_block_t block = ^{
		
		[self maybeUpdateCachedConnectedAddressInfo];
        result = self->cachedConnectedPort;
	};
	
	if (dispatch_get_specific(IsOnSocketQueueOrTargetQueueKey))
		block();
	else
		dispatch_sync(socketQueue, AutoreleasedBlock(block));
	
	return result;
}

- (BOOL)isConnected
{
	__block BOOL result = NO;
	
	dispatch_block_t block = ^{
        result = (self->flags & kDidConnect) ? YES : NO;
	};
	
	if (dispatch_get_specific(IsOnSocketQueueOrTargetQueueKey))
		block();
	else
		dispatch_sync(socketQueue, block);
	
	return result;
}

- (BOOL)isClosed
{
	__block BOOL result = YES;
	
	dispatch_block_t block = ^{
		
        result = (self->flags & kDidCreateSockets) ? NO : YES;
	};
	
	if (dispatch_get_specific(IsOnSocketQueueOrTargetQueueKey))
		block();
	else
		dispatch_sync(socketQueue, block);
	
	return result;
}

- (BOOL)isIPv4
{
	__block BOOL result = NO;
	
	dispatch_block_t block = ^{
		
        if (self->flags & kDidCreateSockets)
		{
            result = (self->socket4FD != SOCKET_NULL);
		}
		else
		{
			result = [self isIPv4Enabled];
		}
	};
	
	if (dispatch_get_specific(IsOnSocketQueueOrTargetQueueKey))
		block();
	else
		dispatch_sync(socketQueue, block);
	
	return result;
}

- (BOOL)isIPv6
{
	__block BOOL result = NO;
	
	dispatch_block_t block = ^{
		
        if (self->flags & kDidCreateSockets)
		{
            result = (self->socket6FD != SOCKET_NULL);
		}
		else
		{
			result = [self isIPv6Enabled];
		}
	};
	
	if (dispatch_get_specific(IsOnSocketQueueOrTargetQueueKey))
		block();
	else
		dispatch_sync(socketQueue, block);
	
	return result;
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
#pragma mark Binding
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * This method runs through the various checks required prior to a bind attempt.
 * It is shared between the various bind methods.
**/
- (BOOL)preBind:(NSError **)errPtr
{
	if (![self preOp:errPtr])
	{
		return NO;
	}
	
	if (flags & kDidBind)
	{
		if (errPtr)
		{
			NSString *msg = @"Cannot bind a socket more than once.";
			*errPtr = [self badConfigError:msg];
		}
		return NO;
	}
	
	if ((flags & kConnecting) || (flags & kDidConnect))
	{
		if (errPtr)
		{
			NSString *msg = @"Cannot bind after connecting. If needed, bind first, then connect.";
			*errPtr = [self badConfigError:msg];
		}
		return NO;
	}
	
	BOOL isIPv4Disabled = (config & kIPv4Disabled) ? YES : NO;
	BOOL isIPv6Disabled = (config & kIPv6Disabled) ? YES : NO;
	
	if (isIPv4Disabled && isIPv6Disabled) // Must have IPv4 or IPv6 enabled
	{
		if (errPtr)
		{
			NSString *msg = @"Both IPv4 and IPv6 have been disabled. Must enable at least one protocol first.";
			*errPtr = [self badConfigError:msg];
		}
		return NO;
	}
	
	return YES;
}

- (BOOL)bindToPort:(uint16_t)port error:(NSError **)errPtr
{
	return [self bindToPort:port interface:nil error:errPtr];
}

- (BOOL)bindToPort:(uint16_t)port interface:(NSString *)interface error:(NSError **)errPtr
{
	__block BOOL result = NO;
	__block NSError *err = nil;
	
	dispatch_block_t block = ^{ @autoreleasepool {
		
		// Run through sanity checks
		
		if (![self preBind:&err])
		{
			return_from_block;
		}
		
		// Check the given interface
		
		NSData *interface4 = nil;
		NSData *interface6 = nil;
		
		[self convertIntefaceDescription:interface port:port intoAddress4:&interface4 address6:&interface6];
		
		if ((interface4 == nil) && (interface6 == nil))
		{
			NSString *msg = @"Unknown interface. Specify valid interface by name (e.g. \"en1\") or IP address.";
			err = [self badParamError:msg];
			
			return_from_block;
		}
		
        BOOL isIPv4Disabled = (self->config & kIPv4Disabled) ? YES : NO;
        BOOL isIPv6Disabled = (self->config & kIPv6Disabled) ? YES : NO;
		
		if (isIPv4Disabled && (interface6 == nil))
		{
			NSString *msg = @"IPv4 has been disabled and specified interface doesn't support IPv6.";
			err = [self badParamError:msg];
			
			return_from_block;
		}
		
		if (isIPv6Disabled && (interface4 == nil))
		{
			NSString *msg = @"IPv6 has been disabled and specified interface doesn't support IPv4.";
			err = [self badParamError:msg];
			
			return_from_block;
		}
		
		// Determine protocol(s)
		
		BOOL useIPv4 = !isIPv4Disabled && (interface4 != nil);
		BOOL useIPv6 = !isIPv6Disabled && (interface6 != nil);
		
		// Create the socket(s) if needed
		
        if ((self->flags & kDidCreateSockets) == 0)
		{
			if (![self createSocket4:useIPv4 socket6:useIPv6 error:&err])
			{
				return_from_block;
			}
		}
		
		// Bind the socket(s)
		
		LogVerbose(@"Binding socket to port(%hu) interface(%@)", port, interface);
		
		if (useIPv4)
		{
            int status = bind(self->socket4FD, (const struct sockaddr *)[interface4 bytes], (socklen_t)[interface4 length]);
			if (status == -1)
			{
				[self closeSockets];
				
				NSString *reason = @"Error in bind() function";
				err = [self errnoErrorWithReason:reason];
				
				return_from_block;
			}
		}
		
		if (useIPv6)
		{
            int status = bind(self->socket6FD, (const struct sockaddr *)[interface6 bytes], (socklen_t)[interface6 length]);
			if (status == -1)
			{
				[self closeSockets];
				
				NSString *reason = @"Error in bind() function";
				err = [self errnoErrorWithReason:reason];
				
				return_from_block;
			}
		}
		
		// Update flags
		
        self->flags |= kDidBind;
		
        if (!useIPv4) self->flags |= kIPv4Deactivated;
        if (!useIPv6) self->flags |= kIPv6Deactivated;
		
		result = YES;
		
	}};
	
	if (dispatch_get_specific(IsOnSocketQueueOrTargetQueueKey))
		block();
	else
		dispatch_sync(socketQueue, block);
	
	if (err)
		LogError(@"Error binding to port/interface: %@", err);
	
	if (errPtr)
		*errPtr = err;
	
	return result;
}

- (BOOL)bindToAddress:(NSData *)localAddr error:(NSError **)errPtr
{
	__block BOOL result = NO;
	__block NSError *err = nil;
	
	dispatch_block_t block = ^{ @autoreleasepool {
		
		// Run through sanity checks
		
		if (![self preBind:&err])
		{
			return_from_block;
		}
		
		// Check the given address
		
		int addressFamily = [[self class] familyFromAddress:localAddr];
		
		if (addressFamily == AF_UNSPEC)
		{
			NSString *msg = @"A valid IPv4 or IPv6 address was not given";
			err = [self badParamError:msg];
			
			return_from_block;
		}
		
		NSData *localAddr4 = (addressFamily == AF_INET)  ? localAddr : nil;
		NSData *localAddr6 = (addressFamily == AF_INET6) ? localAddr : nil;
		
        BOOL isIPv4Disabled = (self->config & kIPv4Disabled) ? YES : NO;
        BOOL isIPv6Disabled = (self->config & kIPv6Disabled) ? YES : NO;
		
		if (isIPv4Disabled && localAddr4)
		{
			NSString *msg = @"IPv4 has been disabled and an IPv4 address was passed.";
			err = [self badParamError:msg];
			
			return_from_block;
		}
		
		if (isIPv6Disabled && localAddr6)
		{
			NSString *msg = @"IPv6 has been disabled and an IPv6 address was passed.";
			err = [self badParamError:msg];
			
			return_from_block;
		}
		
		// Determine protocol(s)
		
		BOOL useIPv4 = !isIPv4Disabled && (localAddr4 != nil);
		BOOL useIPv6 = !isIPv6Disabled && (localAddr6 != nil);
		
		// Create the socket(s) if needed
		
        if ((self->flags & kDidCreateSockets) == 0)
		{
			if (![self createSocket4:useIPv4 socket6:useIPv6 error:&err])
			{
				return_from_block;
			}
		}
		
		// Bind the socket(s)
		
		if (useIPv4)
		{
			LogVerbose(@"Binding socket to address(%@:%hu)",
					   [[self class] hostFromAddress:localAddr4],
					   [[self class] portFromAddress:localAddr4]);
			
            int status = bind(self->socket4FD, (const struct sockaddr *)[localAddr4 bytes], (socklen_t)[localAddr4 length]);
			if (status == -1)
			{
				[self closeSockets];
				
				NSString *reason = @"Error in bind() function";
				err = [self errnoErrorWithReason:reason];
				
				return_from_block;
			}
		}
		else
		{
			LogVerbose(@"Binding socket to address(%@:%hu)",
					   [[self class] hostFromAddress:localAddr6],
					   [[self class] portFromAddress:localAddr6]);
			
            int status = bind(self->socket6FD, (const struct sockaddr *)[localAddr6 bytes], (socklen_t)[localAddr6 length]);
			if (status == -1)
			{
				[self closeSockets];
				
				NSString *reason = @"Error in bind() function";
				err = [self errnoErrorWithReason:reason];
				
				return_from_block;
			}
		}
		
		// Update flags
		
        self->flags |= kDidBind;
		
        if (!useIPv4) self->flags |= kIPv4Deactivated;
        if (!useIPv6) self->flags |= kIPv6Deactivated;
		
		result = YES;
		
	}};
	
	if (dispatch_get_specific(IsOnSocketQueueOrTargetQueueKey))
		block();
	else
		dispatch_sync(socketQueue, block);
	
	if (err)
		LogError(@"Error binding to address: %@", err);
	
	if (errPtr)
		*errPtr = err;
	
	return result;
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
#pragma mark Connecting
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * This method runs through the various checks required prior to a connect attempt.
 * It is shared between the various connect methods.
**/
- (BOOL)preConnect:(NSError **)errPtr
{
	if (![self preOp:errPtr])
	{
		return NO;
	}
	
	if ((flags & kConnecting) || (flags & kDidConnect))
	{
		if (errPtr)
		{
			NSString *msg = @"Cannot connect a socket more than once.";
			*errPtr = [self badConfigError:msg];
		}
		return NO;
	}
	
	BOOL isIPv4Disabled = (config & kIPv4Disabled) ? YES : NO;
	BOOL isIPv6Disabled = (config & kIPv6Disabled) ? YES : NO;
	
	if (isIPv4Disabled && isIPv6Disabled) // Must have IPv4 or IPv6 enabled
	{
		if (errPtr)
		{
			NSString *msg = @"Both IPv4 and IPv6 have been disabled. Must enable at least one protocol first.";
			*errPtr = [self badConfigError:msg];
		}
		return NO;
	}
	
	return YES;
}

- (BOOL)connectToHost:(NSString *)host onPort:(uint16_t)port error:(NSError **)errPtr
{
	__block BOOL result = NO;
	__block NSError *err = nil;
	
	dispatch_block_t block = ^{ @autoreleasepool {
		
		// Run through sanity checks.
		
		if (![self preConnect:&err])
		{
			return_from_block;
		}
		
		// Check parameter(s)
		
		if (host == nil)
		{
			NSString *msg = @"The host param is nil. Should be domain name or IP address string.";
			err = [self badParamError:msg];
			
			return_from_block;
		}
		
		// Create the socket(s) if needed
		
        if ((self->flags & kDidCreateSockets) == 0)
		{
			if (![self createSockets:&err])
			{
				return_from_block;
			}
		}
		
		// Create special connect packet
		
		GCDAsyncUdpSpecialPacket *packet = [[GCDAsyncUdpSpecialPacket alloc] init];
		packet->resolveInProgress = YES;
		
		// Start asynchronous DNS resolve for host:port on background queue
		
		LogVerbose(@"Dispatching DNS resolve for connect...");
		
		[self asyncResolveHost:host port:port withCompletionBlock:^(NSArray *addresses, NSError *error) {
			
			// The asyncResolveHost:port:: method asynchronously dispatches a task onto the global concurrent queue,
			// and immediately returns. Once the async resolve task completes,
			// this block is executed on our socketQueue.
			
			packet->resolveInProgress = NO;
			
			packet->addresses = addresses;
			packet->error = error;
			
			[self maybeConnect];
		}];
		
		// Updates flags, add connect packet to send queue, and pump send queue
		
        self->flags |= kConnecting;
		
        [self->sendQueue addObject:packet];
		[self maybeDequeueSend];
		
		result = YES;
	}};
	
	if (dispatch_get_specific(IsOnSocketQueueOrTargetQueueKey))
		block();
	else
		dispatch_sync(socketQueue, block);
	
	if (err)
		LogError(@"Error connecting to host/port: %@", err);
	
	if (errPtr)
		*errPtr = err;
	
	return result;
}

- (BOOL)connectToAddress:(NSData *)remoteAddr error:(NSError **)errPtr
{
	__block BOOL result = NO;
	__block NSError *err = nil;
	
	dispatch_block_t block = ^{ @autoreleasepool {
		
		// Run through sanity checks.
		
		if (![self preConnect:&err])
		{
			return_from_block;
		}
		
		// Check parameter(s)
		
		if (remoteAddr == nil)
		{
			NSString *msg = @"The address param is nil. Should be a valid address.";
			err = [self badParamError:msg];
			
			return_from_block;
		}
		
		// Create the socket(s) if needed
		
        if ((self->flags & kDidCreateSockets) == 0)
		{
			if (![self createSockets:&err])
			{
				return_from_block;
			}
		}
		
		// The remoteAddr parameter could be of type NSMutableData.
		// So we copy it to be safe.
		
		NSData *address = [remoteAddr copy];
		NSArray *addresses = [NSArray arrayWithObject:address];
		
		GCDAsyncUdpSpecialPacket *packet = [[GCDAsyncUdpSpecialPacket alloc] init];
		packet->addresses = addresses;
		
		// Updates flags, add connect packet to send queue, and pump send queue
		
        self->flags |= kConnecting;
		
        [self->sendQueue addObject:packet];
		[self maybeDequeueSend];
		
		result = YES;
	}};
	
	if (dispatch_get_specific(IsOnSocketQueueOrTargetQueueKey))
		block();
	else
		dispatch_sync(socketQueue, block);
	
	if (err)
		LogError(@"Error connecting to address: %@", err);
	
	if (errPtr)
		*errPtr = err;
	
	return result;
}

- (void)maybeConnect
{
	LogTrace();
	NSAssert(dispatch_get_specific(IsOnSocketQueueOrTargetQueueKey), @"Must be dispatched on socketQueue");
	
	
	BOOL sendQueueReady = [currentSend isKindOfClass:[GCDAsyncUdpSpecialPacket class]];
	
	if (sendQueueReady)
	{
		GCDAsyncUdpSpecialPacket *connectPacket = (GCDAsyncUdpSpecialPacket *)currentSend;
		
		if (connectPacket->resolveInProgress)
		{
			LogVerbose(@"Waiting for DNS resolve...");
		}
		else
		{
			if (connectPacket->error)
			{
				[self notifyDidNotConnect:connectPacket->error];
			}
			else
			{
				NSData *address = nil;
				NSError *error = nil;
				
				int addressFamily = [self getAddress:&address error:&error fromAddresses:connectPacket->addresses];
				
				// Perform connect
				
				BOOL result = NO;
				
				switch (addressFamily)
				{
					case AF_INET  : result = [self connectWithAddress4:address error:&error]; break;
					case AF_INET6 : result = [self connectWithAddress6:address error:&error]; break;
				}
				
				if (result)
				{
					flags |= kDidBind;
					flags |= kDidConnect;
					
					cachedConnectedAddress = address;
					cachedConnectedHost = [[self class] hostFromAddress:address];
					cachedConnectedPort = [[self class] portFromAddress:address];
					cachedConnectedFamily = addressFamily;
					
					[self notifyDidConnectToAddress:address];
				}
				else
				{
					[self notifyDidNotConnect:error];
				}
			}
			
			flags &= ~kConnecting;
			
			[self endCurrentSend];
			[self maybeDequeueSend];
		}
	}
}

- (BOOL)connectWithAddress4:(NSData *)address4 error:(NSError **)errPtr
{
	LogTrace();
	NSAssert(dispatch_get_specific(IsOnSocketQueueOrTargetQueueKey), @"Must be dispatched on socketQueue");
	
	int status = connect(socket4FD, (const struct sockaddr *)[address4 bytes], (socklen_t)[address4 length]);
	if (status != 0)
	{
		if (errPtr)
			*errPtr = [self errnoErrorWithReason:@"Error in connect() function"];
		
		return NO;
	}
	
	[self closeSocket6];
	flags |= kIPv6Deactivated;
	
	return YES;
}

- (BOOL)connectWithAddress6:(NSData *)address6 error:(NSError **)errPtr
{
	LogTrace();
	NSAssert(dispatch_get_specific(IsOnSocketQueueOrTargetQueueKey), @"Must be dispatched on socketQueue");
	
	int status = connect(socket6FD, (const struct sockaddr *)[address6 bytes], (socklen_t)[address6 length]);
	if (status != 0)
	{
		if (errPtr)
			*errPtr = [self errnoErrorWithReason:@"Error in connect() function"];
		
		return NO;
	}
	
	[self closeSocket4];
	flags |= kIPv4Deactivated;
	
	return YES;
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
#pragma mark Multicast
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

- (BOOL)preJoin:(NSError **)errPtr
{
	if (![self preOp:errPtr])
	{
		return NO;
	}
	
	if (!(flags & kDidBind))
	{
		if (errPtr)
		{
			NSString *msg = @"Must bind a socket before joining a multicast group.";
			*errPtr = [self badConfigError:msg];
		}
		return NO;
	}
	
	if ((flags & kConnecting) || (flags & kDidConnect))
	{
		if (errPtr)
		{
			NSString *msg = @"Cannot join a multicast group if connected.";
			*errPtr = [self badConfigError:msg];
		}
		return NO;
	}
	
	return YES;
}

- (BOOL)joinMulticastGroup:(NSString *)group error:(NSError **)errPtr
{
	return [self joinMulticastGroup:group onInterface:nil error:errPtr];
}

- (BOOL)joinMulticastGroup:(NSString *)group onInterface:(NSString *)interface error:(NSError **)errPtr
{
    // IP_ADD_MEMBERSHIP == IPV6_JOIN_GROUP
    return [self performMulticastRequest:IP_ADD_MEMBERSHIP forGroup:group onInterface:interface error:errPtr];
}

- (BOOL)leaveMulticastGroup:(NSString *)group error:(NSError **)errPtr
{
	return [self leaveMulticastGroup:group onInterface:nil error:errPtr];
}

- (BOOL)leaveMulticastGroup:(NSString *)group onInterface:(NSString *)interface error:(NSError **)errPtr
{
    // IP_DROP_MEMBERSHIP == IPV6_LEAVE_GROUP
    return [self performMulticastRequest:IP_DROP_MEMBERSHIP forGroup:group onInterface:interface error:errPtr];
}

- (BOOL)performMulticastRequest:(int)requestType
                       forGroup:(NSString *)group
                    onInterface:(NSString *)interface
                          error:(NSError **)errPtr
{
	__block BOOL result = NO;
	__block NSError *err = nil;
	
	dispatch_block_t block = ^{ @autoreleasepool {
		
		// Run through sanity checks
		
		if (![self preJoin:&err])
		{
			return_from_block;
		}
		
		// Convert group to address
		
		NSData *groupAddr4 = nil;
		NSData *groupAddr6 = nil;
		
		[self convertNumericHost:group port:0 intoAddress4:&groupAddr4 address6:&groupAddr6];
		
		if ((groupAddr4 == nil) && (groupAddr6 == nil))
		{
			NSString *msg = @"Unknown group. Specify valid group IP address.";
			err = [self badParamError:msg];
			
			return_from_block;
		}
		
		// Convert interface to address
		
		NSData *interfaceAddr4 = nil;
		NSData *interfaceAddr6 = nil;
		
		[self convertIntefaceDescription:interface port:0 intoAddress4:&interfaceAddr4 address6:&interfaceAddr6];
		
		if ((interfaceAddr4 == nil) && (interfaceAddr6 == nil))
		{
			NSString *msg = @"Unknown interface. Specify valid interface by name (e.g. \"en1\") or IP address.";
			err = [self badParamError:msg];
			
			return_from_block;
		}
		
		// Perform join
		
        if ((self->socket4FD != SOCKET_NULL) && groupAddr4 && interfaceAddr4)
		{
			const struct sockaddr_in *nativeGroup = (const struct sockaddr_in *)[groupAddr4 bytes];
			const struct sockaddr_in *nativeIface = (const struct sockaddr_in *)[interfaceAddr4 bytes];
			
			struct ip_mreq imreq;
			imreq.imr_multiaddr = nativeGroup->sin_addr;
			imreq.imr_interface = nativeIface->sin_addr;
			
            int status = setsockopt(self->socket4FD, IPPROTO_IP, requestType, (const void *)&imreq, sizeof(imreq));
			if (status != 0)
			{
				err = [self errnoErrorWithReason:@"Error in setsockopt() function"];
				
				return_from_block;
			}
			
			// Using IPv4 only
			[self closeSocket6];
			
			result = YES;
		}
        else if ((self->socket6FD != SOCKET_NULL) && groupAddr6 && interfaceAddr6)
		{
			const struct sockaddr_in6 *nativeGroup = (const struct sockaddr_in6 *)[groupAddr6 bytes];
			
			struct ipv6_mreq imreq;
			imreq.ipv6mr_multiaddr = nativeGroup->sin6_addr;
			imreq.ipv6mr_interface = [self indexOfInterfaceAddr6:interfaceAddr6];
			
            int status = setsockopt(self->socket6FD, IPPROTO_IPV6, requestType, (const void *)&imreq, sizeof(imreq));
			if (status != 0)
			{
				err = [self errnoErrorWithReason:@"Error in setsockopt() function"];
				
				return_from_block;
			}
			
			// Using IPv6 only
			[self closeSocket4];
			
			result = YES;
		}
		else
		{
			NSString *msg = @"Socket, group, and interface do not have matching IP versions";
			err = [self badParamError:msg];
			
			return_from_block;
		}
		
	}};
	
	if (dispatch_get_specific(IsOnSocketQueueOrTargetQueueKey))
		block();
	else
		dispatch_sync(socketQueue, block);
	
	if (errPtr)
		*errPtr = err;
	
	return result;
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
#pragma mark Reuse port
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

- (BOOL)enableReusePort:(BOOL)flag error:(NSError **)errPtr
{
	__block BOOL result = NO;
	__block NSError *err = nil;
	
	dispatch_block_t block = ^{ @autoreleasepool {
		
		if (![self preOp:&err])
		{
			return_from_block;
		}
		
        if ((self->flags & kDidCreateSockets) == 0)
		{
			if (![self createSockets:&err])
			{
				return_from_block;
			}
		}
		
		int value = flag ? 1 : 0;
        if (self->socket4FD != SOCKET_NULL)
		{
            int error = setsockopt(self->socket4FD, SOL_SOCKET, SO_REUSEPORT, (const void *)&value, sizeof(value));
			
			if (error)
			{
				err = [self errnoErrorWithReason:@"Error in setsockopt() function"];
				
				return_from_block;
			}
			result = YES;
		}
		
        if (self->socket6FD != SOCKET_NULL)
		{
            int error = setsockopt(self->socket6FD, SOL_SOCKET, SO_REUSEPORT, (const void *)&value, sizeof(value));
			
			if (error)
			{
				err = [self errnoErrorWithReason:@"Error in setsockopt() function"];
				
				return_from_block;
			}
			result = YES;
		}
		
	}};
	
	if (dispatch_get_specific(IsOnSocketQueueOrTargetQueueKey))
		block();
	else
		dispatch_sync(socketQueue, block);
	
	if (errPtr)
		*errPtr = err;
	
	return result;
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
#pragma mark Broadcast
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

- (BOOL)enableBroadcast:(BOOL)flag error:(NSError **)errPtr
{
	__block BOOL result = NO;
	__block NSError *err = nil;
	
	dispatch_block_t block = ^{ @autoreleasepool {
		
		if (![self preOp:&err])
		{
			return_from_block;
		}
		
        if ((self->flags & kDidCreateSockets) == 0)
		{
			if (![self createSockets:&err])
			{
				return_from_block;
			}
		}
		
        if (self->socket4FD != SOCKET_NULL)
		{
			int value = flag ? 1 : 0;
            int error = setsockopt(self->socket4FD, SOL_SOCKET, SO_BROADCAST, (const void *)&value, sizeof(value));
			
			if (error)
			{
				err = [self errnoErrorWithReason:@"Error in setsockopt() function"];
				
				return_from_block;
			}
			result = YES;
		}
		
		// IPv6 does not implement broadcast, the ability to send a packet to all hosts on the attached link.
		// The same effect can be achieved by sending a packet to the link-local all hosts multicast group.
		
	}};
	
	if (dispatch_get_specific(IsOnSocketQueueOrTargetQueueKey))
		block();
	else
		dispatch_sync(socketQueue, block);
	
	if (errPtr)
		*errPtr = err;
	
	return result;
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
#pragma mark Sending
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

- (void)sendData:(NSData *)data withTag:(long)tag
{
	[self sendData:data withTimeout:-1.0 tag:tag];
}

- (void)sendData:(NSData *)data withTimeout:(NSTimeInterval)timeout tag:(long)tag
{
	LogTrace();
	
	if ([data length] == 0)
	{
		LogWarn(@"Ignoring attempt to send nil/empty data.");
		return;
	}
    
    
	
	GCDAsyncUdpSendPacket *packet = [[GCDAsyncUdpSendPacket alloc] initWithData:data timeout:timeout tag:tag];
	
	dispatch_async(socketQueue, ^{ @autoreleasepool {
		
        [self->sendQueue addObject:packet];
		[self maybeDequeueSend];
	}});
	
}

- (void)sendData:(NSData *)data
          toHost:(NSString *)host
            port:(uint16_t)port
     withTimeout:(NSTimeInterval)timeout
             tag:(long)tag
{
	LogTrace();
	
	if ([data length] == 0)
	{
		LogWarn(@"Ignoring attempt to send nil/empty data.");
		return;
	}
	
	GCDAsyncUdpSendPacket *packet = [[GCDAsyncUdpSendPacket alloc] initWithData:data timeout:timeout tag:tag];
	packet->resolveInProgress = YES;
	
	[self asyncResolveHost:host port:port withCompletionBlock:^(NSArray *addresses, NSError *error) {
		
		// The asyncResolveHost:port:: method asynchronously dispatches a task onto the global concurrent queue,
		// and immediately returns. Once the async resolve task completes,
		// this block is executed on our socketQueue.
		
		packet->resolveInProgress = NO;
		
		packet->resolvedAddresses = addresses;
		packet->resolveError = error;
		
        if (packet == self->currentSend)
		{
			LogVerbose(@"currentSend - address resolved");
			[self doPreSend];
		}
	}];
	
	dispatch_async(socketQueue, ^{ @autoreleasepool {
		
        [self->sendQueue addObject:packet];
		[self maybeDequeueSend];
		
	}});
	
}

- (void)sendData:(NSData *)data toAddress:(NSData *)remoteAddr withTimeout:(NSTimeInterval)timeout tag:(long)tag
{
	LogTrace();
	
	if ([data length] == 0)
	{
		LogWarn(@"Ignoring attempt to send nil/empty data.");
		return;
	}
	
	GCDAsyncUdpSendPacket *packet = [[GCDAsyncUdpSendPacket alloc] initWithData:data timeout:timeout tag:tag];
	packet->addressFamily = [GCDAsyncUdpSocket familyFromAddress:remoteAddr];
	packet->address = remoteAddr;
	
	dispatch_async(socketQueue, ^{ @autoreleasepool {
		
        [self->sendQueue addObject:packet];
		[self maybeDequeueSend];
	}});
}

- (void)setSendFilter:(GCDAsyncUdpSocketSendFilterBlock)filterBlock withQueue:(dispatch_queue_t)filterQueue
{
	[self setSendFilter:filterBlock withQueue:filterQueue isAsynchronous:YES];
}

- (void)setSendFilter:(GCDAsyncUdpSocketSendFilterBlock)filterBlock
            withQueue:(dispatch_queue_t)filterQueue
       isAsynchronous:(BOOL)isAsynchronous
{
	GCDAsyncUdpSocketSendFilterBlock newFilterBlock = NULL;
	dispatch_queue_t newFilterQueue = NULL;
	
	if (filterBlock)
	{
		NSAssert(filterQueue, @"Must provide a dispatch_queue in which to run the filter block.");
		
		newFilterBlock = [filterBlock copy];
		newFilterQueue = filterQueue;
		#if !OS_OBJECT_USE_OBJC
		dispatch_retain(newFilterQueue);
		#endif
	}
	
	dispatch_block_t block = ^{
		
		#if !OS_OBJECT_USE_OBJC
        if (self->sendFilterQueue) dispatch_release(self->sendFilterQueue);
		#endif
		
        self->sendFilterBlock = newFilterBlock;
        self->sendFilterQueue = newFilterQueue;
        self->sendFilterAsync = isAsynchronous;
	};
	
	if (dispatch_get_specific(IsOnSocketQueueOrTargetQueueKey))
		block();
	else
		dispatch_async(socketQueue, block);
}

- (void)maybeDequeueSend
{
	LogTrace();
	NSAssert(dispatch_get_specific(IsOnSocketQueueOrTargetQueueKey), @"Must be dispatched on socketQueue");
	
	// If we don't have a send operation already in progress
	if (currentSend == nil)
	{
		// Create the sockets if needed
		if ((flags & kDidCreateSockets) == 0)
		{
			NSError *err = nil;
			if (![self createSockets:&err])
			{
				[self closeWithError:err];
				return;
			}
		}
		
		while ([sendQueue count] > 0)
		{
			// Dequeue the next object in the queue
			currentSend = [sendQueue objectAtIndex:0];
			[sendQueue removeObjectAtIndex:0];
			
			if ([currentSend isKindOfClass:[GCDAsyncUdpSpecialPacket class]])
			{
				[self maybeConnect];
				
				return; // The maybeConnect method, if it connects, will invoke this method again
			}
			else if (currentSend->resolveError)
			{
				// Notify delegate
				[self notifyDidNotSendDataWithTag:currentSend->tag dueToError:currentSend->resolveError];
				
				// Clear currentSend
				currentSend = nil;
				
				continue;
			}
			else
			{
				// Start preprocessing checks on the send packet
				[self doPreSend];
				
				break;
			}
		}
		
		if ((currentSend == nil) && (flags & kCloseAfterSends))
		{
			[self closeWithError:nil];
		}
	}
}

/**
 * This method is called after a sendPacket has been dequeued.
 * It performs various preprocessing checks on the packet,
 * and queries the sendFilter (if set) to determine if the packet can be sent.
 * 
 * If the packet passes all checks, it will be passed on to the doSend method.
**/
- (void)doPreSend
{
	LogTrace();
	
	// 
	// 1. Check for problems with send packet
	// 
	
	BOOL waitingForResolve = NO;
	NSError *error = nil;
	
	if (flags & kDidConnect)
	{
		// Connected socket
		
		if (currentSend->resolveInProgress || currentSend->resolvedAddresses || currentSend->resolveError)
		{
			NSString *msg = @"Cannot specify destination of packet for connected socket";
			error = [self badConfigError:msg];
		}
		else
		{
			currentSend->address = cachedConnectedAddress;
			currentSend->addressFamily = cachedConnectedFamily;
		}
	}
	else
	{
		// Non-Connected socket
		
		if (currentSend->resolveInProgress)
		{
			// We're waiting for the packet's destination to be resolved.
			waitingForResolve = YES;
		}
		else if (currentSend->resolveError)
		{
			error = currentSend->resolveError;
		}
		else if (currentSend->address == nil)
		{
			if (currentSend->resolvedAddresses == nil)
			{
				NSString *msg = @"You must specify destination of packet for a non-connected socket";
				error = [self badConfigError:msg];
			}
			else
			{
				// Pick the proper address to use (out of possibly several resolved addresses)
				
				NSData *address = nil;
				int addressFamily = AF_UNSPEC;
				
				addressFamily = [self getAddress:&address error:&error fromAddresses:currentSend->resolvedAddresses];
				
				currentSend->address = address;
				currentSend->addressFamily = addressFamily;
			}
		}
	}
	
	if (waitingForResolve)
	{
		// We're waiting for the packet's destination to be resolved.
		
		LogVerbose(@"currentSend - waiting for address resolve");
		
		if (flags & kSock4CanAcceptBytes) {
			[self suspendSend4Source];
		}
		if (flags & kSock6CanAcceptBytes) {
			[self suspendSend6Source];
		}
		
		return;
	}
	
	if (error)
	{
		// Unable to send packet due to some error.
		// Notify delegate and move on.
		
		[self notifyDidNotSendDataWithTag:currentSend->tag dueToError:error];
		[self endCurrentSend];
		[self maybeDequeueSend];
		
		return;
	}
	
	// 
	// 2. Query sendFilter (if applicable)
	// 
	
	if (sendFilterBlock && sendFilterQueue)
	{
		// Query sendFilter
		
		if (sendFilterAsync)
		{
			// Scenario 1 of 3 - Need to asynchronously query sendFilter
			
			currentSend->filterInProgress = YES;
			GCDAsyncUdpSendPacket *sendPacket = currentSend;
			
			dispatch_async(sendFilterQueue, ^{ @autoreleasepool {
				
                BOOL allowed = self->sendFilterBlock(sendPacket->buffer, sendPacket->address, sendPacket->tag);
				
                dispatch_async(self->socketQueue, ^{ @autoreleasepool {
					
					sendPacket->filterInProgress = NO;
                    if (sendPacket == self->currentSend)
					{
						if (allowed)
						{
							[self doSend];
						}
						else
						{
							LogVerbose(@"currentSend - silently dropped by sendFilter");
							
                            [self notifyDidSendDataWithTag:self->currentSend->tag];
							[self endCurrentSend];
							[self maybeDequeueSend];
						}
					}
				}});
			}});
		}
		else
		{
			// Scenario 2 of 3 - Need to synchronously query sendFilter
			
			__block BOOL allowed = YES;
			
			dispatch_sync(sendFilterQueue, ^{ @autoreleasepool {
				
                allowed = self->sendFilterBlock(self->currentSend->buffer, self->currentSend->address, self->currentSend->tag);
			}});
			
			if (allowed)
			{
				[self doSend];
			}
			else
			{
				LogVerbose(@"currentSend - silently dropped by sendFilter");
				
				[self notifyDidSendDataWithTag:currentSend->tag];
				[self endCurrentSend];
				[self maybeDequeueSend];
			}
		}
	}
	else // if (!sendFilterBlock || !sendFilterQueue)
	{
		// Scenario 3 of 3 - No sendFilter. Just go straight into sending.
		
		[self doSend];
	}
}

/**
 * This method performs the actual sending of data in the currentSend packet.
 * It should only be called if the 
**/
- (void)doSend
{
	LogTrace();
	
	NSAssert(currentSend != nil, @"Invalid logic");
	
	// Perform the actual send
	
	ssize_t result = 0;
	
	if (flags & kDidConnect)
	{
		// Connected socket
		
		const void *buffer = [currentSend->buffer bytes];
		size_t length = (size_t)[currentSend->buffer length];
		
		if (currentSend->addressFamily == AF_INET)
		{
			result = send(socket4FD, buffer, length, 0);
			LogVerbose(@"send(socket4FD) = %d", result);
		}
		else
		{
			result = send(socket6FD, buffer, length, 0);
			LogVerbose(@"send(socket6FD) = %d", result);
		}
	}
	else
	{
		// Non-Connected socket
		
		const void *buffer = [currentSend->buffer bytes];
		size_t length = (size_t)[currentSend->buffer length];
		
		const void *dst  = [currentSend->address bytes];
		socklen_t dstSize = (socklen_t)[currentSend->address length];
		
		if (currentSend->addressFamily == AF_INET)
		{
			result = sendto(socket4FD, buffer, length, 0, dst, dstSize);
			LogVerbose(@"sendto(socket4FD) = %d", result);
		}
		else
		{
			result = sendto(socket6FD, buffer, length, 0, dst, dstSize);
			LogVerbose(@"sendto(socket6FD) = %d", result);
		}
	}
	
	// If the socket wasn't bound before, it is now
	
	if ((flags & kDidBind) == 0)
	{
		flags |= kDidBind;
	}
	
	// Check the results.
	// 
	// From the send() & sendto() manpage:
	// 
	// Upon successful completion, the number of bytes which were sent is returned.
	// Otherwise, -1 is returned and the global variable errno is set to indicate the error.
	
	BOOL waitingForSocket = NO;
	NSError *socketError = nil;
	
	if (result == 0)
	{
		waitingForSocket = YES;
	}
	else if (result < 0)
	{
		if (errno == EAGAIN)
			waitingForSocket = YES;
		else
			socketError = [self errnoErrorWithReason:@"Error in send() function."];
	}
	
	if (waitingForSocket)
	{
		// Not enough room in the underlying OS socket send buffer.
		// Wait for a notification of available space.
		
		LogVerbose(@"currentSend - waiting for socket");
		
		if (!(flags & kSock4CanAcceptBytes)) {
			[self resumeSend4Source];
		}
		if (!(flags & kSock6CanAcceptBytes)) {
			[self resumeSend6Source];
		}
		
		if ((sendTimer == NULL) && (currentSend->timeout >= 0.0))
		{
			// Unable to send packet right away.
			// Start timer to timeout the send operation.
			
			[self setupSendTimerWithTimeout:currentSend->timeout];
		}
	}
	else if (socketError)
	{
		[self closeWithError:socketError];
	}
	else // done
	{
		[self notifyDidSendDataWithTag:currentSend->tag];
		[self endCurrentSend];
		[self maybeDequeueSend];
	}
}

/**
 * Releases all resources associated with the currentSend.
**/
- (void)endCurrentSend
{
	if (sendTimer)
	{
		dispatch_source_cancel(sendTimer);
		#if !OS_OBJECT_USE_OBJC
		dispatch_release(sendTimer);
		#endif
		sendTimer = NULL;
	}
	
	currentSend = nil;
}

/**
 * Performs the operations to timeout the current send operation, and move on.
**/
- (void)doSendTimeout
{
	LogTrace();
	
	[self notifyDidNotSendDataWithTag:currentSend->tag dueToError:[self sendTimeoutError]];
	[self endCurrentSend];
	[self maybeDequeueSend];
}

/**
 * Sets up a timer that fires to timeout the current send operation.
 * This method should only be called once per send packet.
**/
- (void)setupSendTimerWithTimeout:(NSTimeInterval)timeout
{
	NSAssert(sendTimer == NULL, @"Invalid logic");
	NSAssert(timeout >= 0.0, @"Invalid logic");
	
	LogTrace();
	
	sendTimer = dispatch_source_create(DISPATCH_SOURCE_TYPE_TIMER, 0, 0, socketQueue);
	
	dispatch_source_set_event_handler(sendTimer, ^{ @autoreleasepool {
		
		[self doSendTimeout];
	}});
	
	dispatch_time_t tt = dispatch_time(DISPATCH_TIME_NOW, (int64_t)(timeout * NSEC_PER_SEC));
	
	dispatch_source_set_timer(sendTimer, tt, DISPATCH_TIME_FOREVER, 0);
	dispatch_resume(sendTimer);
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
#pragma mark Receiving
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

- (BOOL)receiveOnce:(NSError **)errPtr
{
	LogTrace();
	
	__block BOOL result = NO;
	__block NSError *err = nil;
	
	dispatch_block_t block = ^{
		
        if ((self->flags & kReceiveOnce) == 0)
		{
            if ((self->flags & kDidCreateSockets) == 0)
			{
				NSString *msg = @"Must bind socket before you can receive data. "
				@"You can do this explicitly via bind, or implicitly via connect or by sending data.";
				
				err = [self badConfigError:msg];
				return_from_block;
			}
			
            self->flags |=  kReceiveOnce;       // Enable
            self->flags &= ~kReceiveContinuous; // Disable
			
            dispatch_async(self->socketQueue, ^{ @autoreleasepool {
				
				[self doReceive];
			}});
		}
		
		result = YES;
	};
	
	if (dispatch_get_specific(IsOnSocketQueueOrTargetQueueKey))
		block();
	else
		dispatch_sync(socketQueue, block);
	
	if (err)
		LogError(@"Error in beginReceiving: %@", err);
	
	if (errPtr)
		*errPtr = err;
	
	return result;
}

- (BOOL)beginReceiving:(NSError **)errPtr
{
	LogTrace();
	
	__block BOOL result = NO;
	__block NSError *err = nil;
	
	dispatch_block_t block = ^{
		
        if ((self->flags & kReceiveContinuous) == 0)
		{
            if ((self->flags & kDidCreateSockets) == 0)
			{
				NSString *msg = @"Must bind socket before you can receive data. "
								@"You can do this explicitly via bind, or implicitly via connect or by sending data.";
				
				err = [self badConfigError:msg];
				return_from_block;
			}
			
            self->flags |= kReceiveContinuous; // Enable
            self->flags &= ~kReceiveOnce;      // Disable
			
            dispatch_async(self->socketQueue, ^{ @autoreleasepool {
				
				[self doReceive];
			}});
		}
		
		result = YES;
	};
	
	if (dispatch_get_specific(IsOnSocketQueueOrTargetQueueKey))
		block();
	else
		dispatch_sync(socketQueue, block);
	
	if (err)
		LogError(@"Error in beginReceiving: %@", err);
	
	if (errPtr)
		*errPtr = err;
	
	return result;
}

- (void)pauseReceiving
{
	LogTrace();
	
	dispatch_block_t block = ^{
		
        self->flags &= ~kReceiveOnce;       // Disable
        self->flags &= ~kReceiveContinuous; // Disable
		
        if (self->socket4FDBytesAvailable > 0) {
			[self suspendReceive4Source];
		}
        if (self->socket6FDBytesAvailable > 0) {
			[self suspendReceive6Source];
		}
	};
	
	if (dispatch_get_specific(IsOnSocketQueueOrTargetQueueKey))
		block();
	else
		dispatch_async(socketQueue, block);
}

- (void)setReceiveFilter:(GCDAsyncUdpSocketReceiveFilterBlock)filterBlock withQueue:(dispatch_queue_t)filterQueue
{
	[self setReceiveFilter:filterBlock withQueue:filterQueue isAsynchronous:YES];
}

- (void)setReceiveFilter:(GCDAsyncUdpSocketReceiveFilterBlock)filterBlock
               withQueue:(dispatch_queue_t)filterQueue
          isAsynchronous:(BOOL)isAsynchronous
{
	GCDAsyncUdpSocketReceiveFilterBlock newFilterBlock = NULL;
	dispatch_queue_t newFilterQueue = NULL;
	
	if (filterBlock)
	{
		NSAssert(filterQueue, @"Must provide a dispatch_queue in which to run the filter block.");
		
		newFilterBlock = [filterBlock copy];
		newFilterQueue = filterQueue;
		#if !OS_OBJECT_USE_OBJC
		dispatch_retain(newFilterQueue);
		#endif
	}
	
	dispatch_block_t block = ^{
		
		#if !OS_OBJECT_USE_OBJC
        if (self->receiveFilterQueue) dispatch_release(self->receiveFilterQueue);
		#endif
		
        self->receiveFilterBlock = newFilterBlock;
        self->receiveFilterQueue = newFilterQueue;
        self->receiveFilterAsync = isAsynchronous;
	};
	
	if (dispatch_get_specific(IsOnSocketQueueOrTargetQueueKey))
		block();
	else
		dispatch_async(socketQueue, block);
}

- (void)doReceive
{
	LogTrace();
	
	if ((flags & (kReceiveOnce | kReceiveContinuous)) == 0)
	{
		LogVerbose(@"Receiving is paused...");
		
		if (socket4FDBytesAvailable > 0) {
			[self suspendReceive4Source];
		}
		if (socket6FDBytesAvailable > 0) {
			[self suspendReceive6Source];
		}
		
		return;
	}
	
	if ((flags & kReceiveOnce) && (pendingFilterOperations > 0))
	{
		LogVerbose(@"Receiving is temporarily paused (pending filter operations)...");
		
		if (socket4FDBytesAvailable > 0) {
			[self suspendReceive4Source];
		}
		if (socket6FDBytesAvailable > 0) {
			[self suspendReceive6Source];
		}
		
		return;
	}
	
	if ((socket4FDBytesAvailable == 0) && (socket6FDBytesAvailable == 0))
	{
		LogVerbose(@"No data available to receive...");
		
		if (socket4FDBytesAvailable == 0) {
			[self resumeReceive4Source];
		}
		if (socket6FDBytesAvailable == 0) {
			[self resumeReceive6Source];
		}
		
		return;
	}
	
	// Figure out if we should receive on socket4 or socket6
	
	BOOL doReceive4;
	
	if (flags & kDidConnect)
	{
		// Connected socket
		
		doReceive4 = (socket4FD != SOCKET_NULL);
	}
	else
	{
		// Non-Connected socket
		
		if (socket4FDBytesAvailable > 0)
		{
			if (socket6FDBytesAvailable > 0)
			{
				// Bytes available on socket4 & socket6
				
				doReceive4 = (flags & kFlipFlop) ? YES : NO;
				
				flags ^= kFlipFlop; // flags = flags xor kFlipFlop; (toggle flip flop bit)
			}
			else {
				// Bytes available on socket4, but not socket6
				doReceive4 = YES;
			}
		}
		else {
			// Bytes available on socket6, but not socket4
			doReceive4 = NO;
		}
	}
	
	// Perform socket IO
	
	ssize_t result = 0;
	
	NSData *data = nil;
	NSData *addr4 = nil;
	NSData *addr6 = nil;
	
	if (doReceive4)
	{
		NSAssert(socket4FDBytesAvailable > 0, @"Invalid logic");
		LogVerbose(@"Receiving on IPv4");
		
		struct sockaddr_in sockaddr4;
		socklen_t sockaddr4len = sizeof(sockaddr4);
		
		// #222: GCD does not necessarily return the size of an entire UDP packet 
		// from dispatch_source_get_data(), so we must use the maximum packet size.
		size_t bufSize = max4ReceiveSize;
		void *buf = malloc(bufSize);
		
		result = recvfrom(socket4FD, buf, bufSize, 0, (struct sockaddr *)&sockaddr4, &sockaddr4len);
		LogVerbose(@"recvfrom(socket4FD) = %i", (int)result);
		
		if (result > 0)
		{
			if ((size_t)result >= socket4FDBytesAvailable)
				socket4FDBytesAvailable = 0;
			else
				socket4FDBytesAvailable -= result;
			
			if ((size_t)result != bufSize) {
				buf = realloc(buf, result);
			}
			
			data = [NSData dataWithBytesNoCopy:buf length:result freeWhenDone:YES];
			addr4 = [NSData dataWithBytes:&sockaddr4 length:sockaddr4len];
		}
		else
		{
			LogVerbose(@"recvfrom(socket4FD) = %@", [self errnoError]);
			socket4FDBytesAvailable = 0;
			free(buf);
		}
	}
	else
	{
		NSAssert(socket6FDBytesAvailable > 0, @"Invalid logic");
		LogVerbose(@"Receiving on IPv6");
		
		struct sockaddr_in6 sockaddr6;
		socklen_t sockaddr6len = sizeof(sockaddr6);
		
		// #222: GCD does not necessarily return the size of an entire UDP packet 
		// from dispatch_source_get_data(), so we must use the maximum packet size.
		size_t bufSize = max6ReceiveSize;
		void *buf = malloc(bufSize);
		
		result = recvfrom(socket6FD, buf, bufSize, 0, (struct sockaddr *)&sockaddr6, &sockaddr6len);
		LogVerbose(@"recvfrom(socket6FD) -> %i", (int)result);
		
		if (result > 0)
		{
			if ((size_t)result >= socket6FDBytesAvailable)
				socket6FDBytesAvailable = 0;
			else
				socket6FDBytesAvailable -= result;
			
			if ((size_t)result != bufSize) {
				buf = realloc(buf, result);
			}
		
			data = [NSData dataWithBytesNoCopy:buf length:result freeWhenDone:YES];
			addr6 = [NSData dataWithBytes:&sockaddr6 length:sockaddr6len];
		}
		else
		{
			LogVerbose(@"recvfrom(socket6FD) = %@", [self errnoError]);
			socket6FDBytesAvailable = 0;
			free(buf);
		}
	}
	
	
	BOOL waitingForSocket = NO;
	BOOL notifiedDelegate = NO;
	BOOL ignored = NO;
	
	NSError *socketError = nil;
	
	if (result == 0)
	{
		waitingForSocket = YES;
	}
	else if (result < 0)
	{
		if (errno == EAGAIN)
			waitingForSocket = YES;
		else
			socketError = [self errnoErrorWithReason:@"Error in recvfrom() function"];
	}
	else
	{
		if (flags & kDidConnect)
		{
			if (addr4 && ![self isConnectedToAddress4:addr4])
				ignored = YES;
			if (addr6 && ![self isConnectedToAddress6:addr6])
				ignored = YES;
		}
		
		NSData *addr = (addr4 != nil) ? addr4 : addr6;
		
		if (!ignored)
		{
			if (receiveFilterBlock && receiveFilterQueue)
			{
				// Run data through filter, and if approved, notify delegate
				
				__block id filterContext = nil;
				__block BOOL allowed = NO;
				
				if (receiveFilterAsync)
				{
					pendingFilterOperations++;
					dispatch_async(receiveFilterQueue, ^{ @autoreleasepool {
						
                        allowed = self->receiveFilterBlock(data, addr, &filterContext);
						
						// Transition back to socketQueue to get the current delegate / delegateQueue
                        dispatch_async(self->socketQueue, ^{ @autoreleasepool {
							
                            self->pendingFilterOperations--;
							
							if (allowed)
							{
								[self notifyDidReceiveData:data fromAddress:addr withFilterContext:filterContext];
							}
							else
							{
								LogVerbose(@"received packet silently dropped by receiveFilter");
							}
							
                            if (self->flags & kReceiveOnce)
							{
								if (allowed)
								{
									// The delegate has been notified,
									// so our receive once operation has completed.
                                    self->flags &= ~kReceiveOnce;
								}
                                else if (self->pendingFilterOperations == 0)
								{
									// All pending filter operations have completed,
									// and none were allowed through.
									// Our receive once operation hasn't completed yet.
									[self doReceive];
								}
							}
						}});
					}});
				}
				else // if (!receiveFilterAsync)
				{
					dispatch_sync(receiveFilterQueue, ^{ @autoreleasepool {
						
                        allowed = self->receiveFilterBlock(data, addr, &filterContext);
					}});
					
					if (allowed)
					{
						[self notifyDidReceiveData:data fromAddress:addr withFilterContext:filterContext];
						notifiedDelegate = YES;
					}
					else
					{
						LogVerbose(@"received packet silently dropped by receiveFilter");
						ignored = YES;
					}
				}
			}
			else // if (!receiveFilterBlock || !receiveFilterQueue)
			{
				[self notifyDidReceiveData:data fromAddress:addr withFilterContext:nil];
				notifiedDelegate = YES;
			}
		}
	}
	
	if (waitingForSocket)
	{
		// Wait for a notification of available data.
		
		if (socket4FDBytesAvailable == 0) {
			[self resumeReceive4Source];
		}
		if (socket6FDBytesAvailable == 0) {
			[self resumeReceive6Source];
		}
	}
	else if (socketError)
	{
		[self closeWithError:socketError];
	}
	else
	{
		if (flags & kReceiveContinuous)
		{
			// Continuous receive mode
			[self doReceive];
		}
		else
		{
			// One-at-a-time receive mode
			if (notifiedDelegate)
			{
				// The delegate has been notified (no set filter).
				// So our receive once operation has completed.
				flags &= ~kReceiveOnce;
			}
			else if (ignored)
			{
				[self doReceive];
			}
			else
			{
				// Waiting on asynchronous receive filter...
			}
		}
	}
}

- (void)doReceiveEOF
{
	LogTrace();
	
	[self closeWithError:[self socketClosedError]];
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
#pragma mark Closing
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

- (void)closeWithError:(NSError *)error
{
	LogVerbose(@"closeWithError: %@", error);
	
	NSAssert(dispatch_get_specific(IsOnSocketQueueOrTargetQueueKey), @"Must be dispatched on socketQueue");
	
	if (currentSend) [self endCurrentSend];
	
	[sendQueue removeAllObjects];
	
	// If a socket has been created, we should notify the delegate.
	BOOL shouldCallDelegate = (flags & kDidCreateSockets) ? YES : NO;
	
	// Close all sockets, send/receive sources, cfstreams, etc
#if TARGET_OS_IPHONE
	[self removeStreamsFromRunLoop];
	[self closeReadAndWriteStreams];
#endif
	[self closeSockets];
	
	// Clear all flags (config remains as is)
	flags = 0;
	
	if (shouldCallDelegate)
	{
		[self notifyDidCloseWithError:error];
	}
}

- (void)close
{
	LogTrace();
	
	dispatch_block_t block = ^{ @autoreleasepool {
		
		[self closeWithError:nil];
	}};
	
	if (dispatch_get_specific(IsOnSocketQueueOrTargetQueueKey))
		block();
	else
		dispatch_sync(socketQueue, block);
}

- (void)closeAfterSending
{
	LogTrace();
	
	dispatch_block_t block = ^{ @autoreleasepool {
		
        self->flags |= kCloseAfterSends;
		
        if (self->currentSend == nil && [self->sendQueue count] == 0)
		{
			[self closeWithError:nil];
		}
	}};
	
	if (dispatch_get_specific(IsOnSocketQueueOrTargetQueueKey))
		block();
	else
		dispatch_async(socketQueue, block);
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
#pragma mark CFStream
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

#if TARGET_OS_IPHONE

static NSThread *listenerThread;

+ (void)ignore:(id)_
{}

+ (void)startListenerThreadIfNeeded
{
	static dispatch_once_t predicate;
	dispatch_once(&predicate, ^{
		
		listenerThread = [[NSThread alloc] initWithTarget:self
		                                         selector:@selector(listenerThread:)
		                                           object:nil];
		[listenerThread start];
	});
}

+ (void)listenerThread:(id)unused
{
	@autoreleasepool {
	
		[[NSThread currentThread] setName:GCDAsyncUdpSocketThreadName];
		
		LogInfo(@"ListenerThread: Started");
		
		// We can't run the run loop unless it has an associated input source or a timer.
		// So we'll just create a timer that will never fire - unless the server runs for a decades.
		[NSTimer scheduledTimerWithTimeInterval:[[NSDate distantFuture] timeIntervalSinceNow]
		                                 target:self
		                               selector:@selector(ignore:)
		                               userInfo:nil
		                                repeats:YES];
		
		[[NSRunLoop currentRunLoop] run];
		
		LogInfo(@"ListenerThread: Stopped");
	}
}

+ (void)addStreamListener:(GCDAsyncUdpSocket *)asyncUdpSocket
{
	LogTrace();
	NSAssert([NSThread currentThread] == listenerThread, @"Invoked on wrong thread");
	
	CFRunLoopRef runLoop = CFRunLoopGetCurrent();
	
	if (asyncUdpSocket->readStream4)
		CFReadStreamScheduleWithRunLoop(asyncUdpSocket->readStream4, runLoop, kCFRunLoopDefaultMode);
	
	if (asyncUdpSocket->readStream6)
		CFReadStreamScheduleWithRunLoop(asyncUdpSocket->readStream6, runLoop, kCFRunLoopDefaultMode);
	
	if (asyncUdpSocket->writeStream4)
		CFWriteStreamScheduleWithRunLoop(asyncUdpSocket->writeStream4, runLoop, kCFRunLoopDefaultMode);
	
	if (asyncUdpSocket->writeStream6)
		CFWriteStreamScheduleWithRunLoop(asyncUdpSocket->writeStream6, runLoop, kCFRunLoopDefaultMode);
}

+ (void)removeStreamListener:(GCDAsyncUdpSocket *)asyncUdpSocket
{
	LogTrace();
	NSAssert([NSThread currentThread] == listenerThread, @"Invoked on wrong thread");
	
	CFRunLoopRef runLoop = CFRunLoopGetCurrent();
	
	if (asyncUdpSocket->readStream4)
		CFReadStreamUnscheduleFromRunLoop(asyncUdpSocket->readStream4, runLoop, kCFRunLoopDefaultMode);
	
	if (asyncUdpSocket->readStream6)
		CFReadStreamUnscheduleFromRunLoop(asyncUdpSocket->readStream6, runLoop, kCFRunLoopDefaultMode);
	
	if (asyncUdpSocket->writeStream4)
		CFWriteStreamUnscheduleFromRunLoop(asyncUdpSocket->writeStream4, runLoop, kCFRunLoopDefaultMode);
	
	if (asyncUdpSocket->writeStream6)
		CFWriteStreamUnscheduleFromRunLoop(asyncUdpSocket->writeStream6, runLoop, kCFRunLoopDefaultMode);
}

static void CFReadStreamCallback(CFReadStreamRef stream, CFStreamEventType type, void *pInfo)
{
	@autoreleasepool {
		GCDAsyncUdpSocket *asyncUdpSocket = (__bridge GCDAsyncUdpSocket *)pInfo;
	
		switch(type)
		{
			case kCFStreamEventOpenCompleted:
			{
				LogCVerbose(@"CFReadStreamCallback - Open");
				break;
			}
			case kCFStreamEventHasBytesAvailable:
			{
				LogCVerbose(@"CFReadStreamCallback - HasBytesAvailable");
				break;
			}
			case kCFStreamEventErrorOccurred:
			case kCFStreamEventEndEncountered:
			{
				NSError *error = (__bridge_transfer NSError *)CFReadStreamCopyError(stream);
				if (error == nil && type == kCFStreamEventEndEncountered)
				{
					error = [asyncUdpSocket socketClosedError];
				}
				
				dispatch_async(asyncUdpSocket->socketQueue, ^{ @autoreleasepool {
					
					LogCVerbose(@"CFReadStreamCallback - %@",
					             (type == kCFStreamEventErrorOccurred) ? @"Error" : @"EndEncountered");
					
					if (stream != asyncUdpSocket->readStream4 &&
					    stream != asyncUdpSocket->readStream6  )
					{
						LogCVerbose(@"CFReadStreamCallback - Ignored");
						return_from_block;
					}
					
					[asyncUdpSocket closeWithError:error];
					
				}});
				
				break;
			}
			default:
			{
				LogCError(@"CFReadStreamCallback - UnknownType: %i", (int)type);
			}
		}
	}
}

static void CFWriteStreamCallback(CFWriteStreamRef stream, CFStreamEventType type, void *pInfo)
{
	@autoreleasepool {
		GCDAsyncUdpSocket *asyncUdpSocket = (__bridge GCDAsyncUdpSocket *)pInfo;
		
		switch(type)
		{
			case kCFStreamEventOpenCompleted:
			{
				LogCVerbose(@"CFWriteStreamCallback - Open");
				break;
			}
			case kCFStreamEventCanAcceptBytes:
			{
				LogCVerbose(@"CFWriteStreamCallback - CanAcceptBytes");
				break;
			}
			case kCFStreamEventErrorOccurred:
			case kCFStreamEventEndEncountered:
			{
				NSError *error = (__bridge_transfer NSError *)CFWriteStreamCopyError(stream);
				if (error == nil && type == kCFStreamEventEndEncountered)
				{
					error = [asyncUdpSocket socketClosedError];
				}
				
				dispatch_async(asyncUdpSocket->socketQueue, ^{ @autoreleasepool {
					
					LogCVerbose(@"CFWriteStreamCallback - %@",
					             (type == kCFStreamEventErrorOccurred) ? @"Error" : @"EndEncountered");
					
					if (stream != asyncUdpSocket->writeStream4 &&
					    stream != asyncUdpSocket->writeStream6  )
					{
						LogCVerbose(@"CFWriteStreamCallback - Ignored");
						return_from_block;
					}
					
					[asyncUdpSocket closeWithError:error];
					
				}});
				
				break;
			}
			default:
			{
				LogCError(@"CFWriteStreamCallback - UnknownType: %i", (int)type);
			}
		}
	}
}

- (BOOL)createReadAndWriteStreams:(NSError **)errPtr
{
	LogTrace();
	NSAssert(dispatch_get_specific(IsOnSocketQueueOrTargetQueueKey), @"Must be dispatched on socketQueue");
	
	NSError *err = nil;
	
	if (readStream4 || writeStream4 || readStream6 || writeStream6)
	{
		// Streams already created
		return YES;
	}
	
	if (socket4FD == SOCKET_NULL && socket6FD == SOCKET_NULL)
	{
		err = [self otherError:@"Cannot create streams without a file descriptor"];
		goto Failed;
	}
	
	// Create streams
	
	LogVerbose(@"Creating read and write stream(s)...");
	
	if (socket4FD != SOCKET_NULL)
	{
		CFStreamCreatePairWithSocket(NULL, (CFSocketNativeHandle)socket4FD, &readStream4, &writeStream4);
		if (!readStream4 || !writeStream4)
		{
			err = [self otherError:@"Error in CFStreamCreatePairWithSocket() [IPv4]"];
			goto Failed;
		}
	}
	
	if (socket6FD != SOCKET_NULL)
	{
		CFStreamCreatePairWithSocket(NULL, (CFSocketNativeHandle)socket6FD, &readStream6, &writeStream6);
		if (!readStream6 || !writeStream6)
		{
			err = [self otherError:@"Error in CFStreamCreatePairWithSocket() [IPv6]"];
			goto Failed;
		}
	}
	
	// Ensure the CFStream's don't close our underlying socket
	
	CFReadStreamSetProperty(readStream4, kCFStreamPropertyShouldCloseNativeSocket, kCFBooleanFalse);
	CFWriteStreamSetProperty(writeStream4, kCFStreamPropertyShouldCloseNativeSocket, kCFBooleanFalse);
	
	CFReadStreamSetProperty(readStream6, kCFStreamPropertyShouldCloseNativeSocket, kCFBooleanFalse);
	CFWriteStreamSetProperty(writeStream6, kCFStreamPropertyShouldCloseNativeSocket, kCFBooleanFalse);
	
	return YES;
	
Failed:
	if (readStream4)
	{
		CFReadStreamClose(readStream4);
		CFRelease(readStream4);
		readStream4 = NULL;
	}
	if (writeStream4)
	{
		CFWriteStreamClose(writeStream4);
		CFRelease(writeStream4);
		writeStream4 = NULL;
	}
	if (readStream6)
	{
		CFReadStreamClose(readStream6);
		CFRelease(readStream6);
		readStream6 = NULL;
	}
	if (writeStream6)
	{
		CFWriteStreamClose(writeStream6);
		CFRelease(writeStream6);
		writeStream6 = NULL;
	}
	
	if (errPtr)
		*errPtr = err;
	
	return NO;
}

- (BOOL)registerForStreamCallbacks:(NSError **)errPtr
{
	LogTrace();
	
	NSAssert(dispatch_get_specific(IsOnSocketQueueOrTargetQueueKey), @"Must be dispatched on socketQueue");
	NSAssert(readStream4 || writeStream4 || readStream6 || writeStream6, @"Read/Write streams are null");
	
	NSError *err = nil;
	
	streamContext.version = 0;
	streamContext.info = (__bridge void *)self;
	streamContext.retain = nil;
	streamContext.release = nil;
	streamContext.copyDescription = nil;
	
	CFOptionFlags readStreamEvents = kCFStreamEventErrorOccurred | kCFStreamEventEndEncountered;
	CFOptionFlags writeStreamEvents = kCFStreamEventErrorOccurred | kCFStreamEventEndEncountered;
	
//	readStreamEvents  |= (kCFStreamEventOpenCompleted | kCFStreamEventHasBytesAvailable);
//	writeStreamEvents |= (kCFStreamEventOpenCompleted | kCFStreamEventCanAcceptBytes);
	
	if (socket4FD != SOCKET_NULL)
	{
		if (readStream4 == NULL || writeStream4 == NULL)
		{
			err = [self otherError:@"Read/Write stream4 is null"];
			goto Failed;
		}
		
		BOOL r1 = CFReadStreamSetClient(readStream4, readStreamEvents, &CFReadStreamCallback, &streamContext);
		BOOL r2 = CFWriteStreamSetClient(writeStream4, writeStreamEvents, &CFWriteStreamCallback, &streamContext);
		
		if (!r1 || !r2)
		{
			err = [self otherError:@"Error in CFStreamSetClient(), [IPv4]"];
			goto Failed;
		}
	}
	
	if (socket6FD != SOCKET_NULL)
	{
		if (readStream6 == NULL || writeStream6 == NULL)
		{
			err = [self otherError:@"Read/Write stream6 is null"];
			goto Failed;
		}
		
		BOOL r1 = CFReadStreamSetClient(readStream6, readStreamEvents, &CFReadStreamCallback, &streamContext);
		BOOL r2 = CFWriteStreamSetClient(writeStream6, writeStreamEvents, &CFWriteStreamCallback, &streamContext);
		
		if (!r1 || !r2)
		{
			err = [self otherError:@"Error in CFStreamSetClient() [IPv6]"];
			goto Failed;
		}
	}
	
	return YES;
	
Failed:
	if (readStream4) {
		CFReadStreamSetClient(readStream4, kCFStreamEventNone, NULL, NULL);
	}
	if (writeStream4) {
		CFWriteStreamSetClient(writeStream4, kCFStreamEventNone, NULL, NULL);
	}
	if (readStream6) {
		CFReadStreamSetClient(readStream6, kCFStreamEventNone, NULL, NULL);
	}
	if (writeStream6) {
		CFWriteStreamSetClient(writeStream6, kCFStreamEventNone, NULL, NULL);
	}
	
	if (errPtr) *errPtr = err;
	return NO;
}

- (BOOL)addStreamsToRunLoop:(NSError **)errPtr
{
	LogTrace();
	
	NSAssert(dispatch_get_specific(IsOnSocketQueueOrTargetQueueKey), @"Must be dispatched on socketQueue");
	NSAssert(readStream4 || writeStream4 || readStream6 || writeStream6, @"Read/Write streams are null");
	
	if (!(flags & kAddedStreamListener))
	{
		[[self class] startListenerThreadIfNeeded];
		[[self class] performSelector:@selector(addStreamListener:)
		                     onThread:listenerThread
		                   withObject:self
		                waitUntilDone:YES];
		
		flags |= kAddedStreamListener;
	}
	
	return YES;
}

- (BOOL)openStreams:(NSError **)errPtr
{
	LogTrace();
	
	NSAssert(dispatch_get_specific(IsOnSocketQueueOrTargetQueueKey), @"Must be dispatched on socketQueue");
	NSAssert(readStream4 || writeStream4 || readStream6 || writeStream6, @"Read/Write streams are null");
	
	NSError *err = nil;
	
	if (socket4FD != SOCKET_NULL)
	{
		BOOL r1 = CFReadStreamOpen(readStream4);
		BOOL r2 = CFWriteStreamOpen(writeStream4);
		
		if (!r1 || !r2)
		{
			err = [self otherError:@"Error in CFStreamOpen() [IPv4]"];
			goto Failed;
		}
	}
	
	if (socket6FD != SOCKET_NULL)
	{
		BOOL r1 = CFReadStreamOpen(readStream6);
		BOOL r2 = CFWriteStreamOpen(writeStream6);
		
		if (!r1 || !r2)
		{
			err = [self otherError:@"Error in CFStreamOpen() [IPv6]"];
			goto Failed;
		}
	}
	
	return YES;
	
Failed:
	if (errPtr) *errPtr = err;
	return NO;
}

- (void)removeStreamsFromRunLoop
{
	LogTrace();
	NSAssert(dispatch_get_specific(IsOnSocketQueueOrTargetQueueKey), @"Must be dispatched on socketQueue");
	
	if (flags & kAddedStreamListener)
	{
		[[self class] performSelector:@selector(removeStreamListener:)
		                     onThread:listenerThread
		                   withObject:self
		                waitUntilDone:YES];
		
		flags &= ~kAddedStreamListener;
	}
}

- (void)closeReadAndWriteStreams
{
	LogTrace();
	
	if (readStream4)
	{
		CFReadStreamSetClient(readStream4, kCFStreamEventNone, NULL, NULL);
		CFReadStreamClose(readStream4);
		CFRelease(readStream4);
		readStream4 = NULL;
	}
	if (writeStream4)
	{
		CFWriteStreamSetClient(writeStream4, kCFStreamEventNone, NULL, NULL);
		CFWriteStreamClose(writeStream4);
		CFRelease(writeStream4);
		writeStream4 = NULL;
	}
	if (readStream6)
	{
		CFReadStreamSetClient(readStream6, kCFStreamEventNone, NULL, NULL);
		CFReadStreamClose(readStream6);
		CFRelease(readStream6);
		readStream6 = NULL;
	}
	if (writeStream6)
	{
		CFWriteStreamSetClient(writeStream6, kCFStreamEventNone, NULL, NULL);
		CFWriteStreamClose(writeStream6);
		CFRelease(writeStream6);
		writeStream6 = NULL;
	}
}

#endif

#if TARGET_OS_IPHONE
- (void)applicationWillEnterForeground:(NSNotification *)notification
{
	LogTrace();
	
	// If the application was backgrounded, then iOS may have shut down our sockets.
	// So we take a quick look to see if any of them received an EOF.
	
	dispatch_block_t block = ^{ @autoreleasepool {
		
		[self resumeReceive4Source];
		[self resumeReceive6Source];
	}};
	
	if (dispatch_get_specific(IsOnSocketQueueOrTargetQueueKey))
		block();
	else
		dispatch_async(socketQueue, block);
}
#endif

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
#pragma mark Advanced
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * See header file for big discussion of this method.
 **/
- (void)markSocketQueueTargetQueue:(dispatch_queue_t)socketNewTargetQueue
{
	void *nonNullUnusedPointer = (__bridge void *)self;
	dispatch_queue_set_specific(socketNewTargetQueue, IsOnSocketQueueOrTargetQueueKey, nonNullUnusedPointer, NULL);
}

/**
 * See header file for big discussion of this method.
 **/
- (void)unmarkSocketQueueTargetQueue:(dispatch_queue_t)socketOldTargetQueue
{
	dispatch_queue_set_specific(socketOldTargetQueue, IsOnSocketQueueOrTargetQueueKey, NULL, NULL);
}

- (void)performBlock:(dispatch_block_t)block
{
	if (dispatch_get_specific(IsOnSocketQueueOrTargetQueueKey))
		block();
	else
		dispatch_sync(socketQueue, block);
}

- (int)socketFD
{
	if (! dispatch_get_specific(IsOnSocketQueueOrTargetQueueKey))
	{
		LogWarn(@"%@: %@ - Method only available from within the context of a performBlock: invocation",
				THIS_FILE, THIS_METHOD);
		return SOCKET_NULL;
	}
	
	if (socket4FD != SOCKET_NULL)
		return socket4FD;
	else
		return socket6FD;
}

- (int)socket4FD
{
	if (! dispatch_get_specific(IsOnSocketQueueOrTargetQueueKey))
	{
		LogWarn(@"%@: %@ - Method only available from within the context of a performBlock: invocation",
				THIS_FILE, THIS_METHOD);
		return SOCKET_NULL;
	}
	
	return socket4FD;
}

- (int)socket6FD
{
	if (! dispatch_get_specific(IsOnSocketQueueOrTargetQueueKey))
	{
		LogWarn(@"%@: %@ - Method only available from within the context of a performBlock: invocation",
				THIS_FILE, THIS_METHOD);
		return SOCKET_NULL;
	}
	
	return socket6FD;
}

#if TARGET_OS_IPHONE

- (CFReadStreamRef)readStream
{
	if (! dispatch_get_specific(IsOnSocketQueueOrTargetQueueKey))
	{
		LogWarn(@"%@: %@ - Method only available from within the context of a performBlock: invocation",
				THIS_FILE, THIS_METHOD);
		return NULL;
	}
	
	NSError *err = nil;
	if (![self createReadAndWriteStreams:&err])
	{
		LogError(@"Error creating CFStream(s): %@", err);
		return NULL;
	}
	
	// Todo...
	
	if (readStream4)
		return readStream4;
	else
		return readStream6;
}

- (CFWriteStreamRef)writeStream
{
	if (! dispatch_get_specific(IsOnSocketQueueOrTargetQueueKey))
	{
		LogWarn(@"%@: %@ - Method only available from within the context of a performBlock: invocation",
				THIS_FILE, THIS_METHOD);
		return NULL;
	}
	
	NSError *err = nil;
	if (![self createReadAndWriteStreams:&err])
	{
		LogError(@"Error creating CFStream(s): %@", err);
		return NULL;
	}
	
	if (writeStream4)
		return writeStream4;
	else
		return writeStream6;
}

- (BOOL)enableBackgroundingOnSockets
{
	if (! dispatch_get_specific(IsOnSocketQueueOrTargetQueueKey))
	{
		LogWarn(@"%@: %@ - Method only available from within the context of a performBlock: invocation",
				THIS_FILE, THIS_METHOD);
		return NO;
	}
	
	// Why is this commented out?
	// See comments below.
	
//	NSError *err = nil;
//	if (![self createReadAndWriteStreams:&err])
//	{
//		LogError(@"Error creating CFStream(s): %@", err);
//		return NO;
//	}
//	
//	LogVerbose(@"Enabling backgrouding on socket");
//	
//	BOOL r1, r2;
//	
//	if (readStream4 && writeStream4)
//	{
//		r1 = CFReadStreamSetProperty(readStream4, kCFStreamNetworkServiceType, kCFStreamNetworkServiceTypeVoIP);
//		r2 = CFWriteStreamSetProperty(writeStream4, kCFStreamNetworkServiceType, kCFStreamNetworkServiceTypeVoIP);
//		
//		if (!r1 || !r2)
//		{
//			LogError(@"Error setting voip type (IPv4)");
//			return NO;
//		}
//	}
//	
//	if (readStream6 && writeStream6)
//	{
//		r1 = CFReadStreamSetProperty(readStream6, kCFStreamNetworkServiceType, kCFStreamNetworkServiceTypeVoIP);
//		r2 = CFWriteStreamSetProperty(writeStream6, kCFStreamNetworkServiceType, kCFStreamNetworkServiceTypeVoIP);
//		
//		if (!r1 || !r2)
//		{
//			LogError(@"Error setting voip type (IPv6)");
//			return NO;
//		}
//	}
//	
//	return YES;
	
	// The above code will actually appear to work.
	// The methods will return YES, and everything will appear fine.
	// 
	// One tiny problem: the sockets will still get closed when the app gets backgrounded.
	// 
	// Apple does not officially support backgrounding UDP sockets.
	
	return NO;
}

#endif

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
#pragma mark Class Methods
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

+ (NSString *)hostFromSockaddr4:(const struct sockaddr_in *)pSockaddr4
{
	char addrBuf[INET_ADDRSTRLEN];
	
	if (inet_ntop(AF_INET, &pSockaddr4->sin_addr, addrBuf, (socklen_t)sizeof(addrBuf)) == NULL)
	{
		addrBuf[0] = '\0';
	}
	
	return [NSString stringWithCString:addrBuf encoding:NSASCIIStringEncoding];
}

+ (NSString *)hostFromSockaddr6:(const struct sockaddr_in6 *)pSockaddr6
{
	char addrBuf[INET6_ADDRSTRLEN];
	
	if (inet_ntop(AF_INET6, &pSockaddr6->sin6_addr, addrBuf, (socklen_t)sizeof(addrBuf)) == NULL)
	{
		addrBuf[0] = '\0';
	}
	
	return [NSString stringWithCString:addrBuf encoding:NSASCIIStringEncoding];
}

+ (uint16_t)portFromSockaddr4:(const struct sockaddr_in *)pSockaddr4
{
	return ntohs(pSockaddr4->sin_port);
}

+ (uint16_t)portFromSockaddr6:(const struct sockaddr_in6 *)pSockaddr6
{
	return ntohs(pSockaddr6->sin6_port);
}

+ (NSString *)hostFromAddress:(NSData *)address
{
	NSString *host = nil;
	[self getHost:&host port:NULL family:NULL fromAddress:address];
	
	return host;
}

+ (uint16_t)portFromAddress:(NSData *)address
{
	uint16_t port = 0;
	[self getHost:NULL port:&port family:NULL fromAddress:address];
	
	return port;
}

+ (int)familyFromAddress:(NSData *)address
{
	int af = AF_UNSPEC;
	[self getHost:NULL port:NULL family:&af fromAddress:address];
	
	return af;
}

+ (BOOL)isIPv4Address:(NSData *)address
{
	int af = AF_UNSPEC;
	[self getHost:NULL port:NULL family:&af fromAddress:address];
	
	return (af == AF_INET);
}

+ (BOOL)isIPv6Address:(NSData *)address
{
	int af = AF_UNSPEC;
	[self getHost:NULL port:NULL family:&af fromAddress:address];
	
	return (af == AF_INET6);
}

+ (BOOL)getHost:(NSString **)hostPtr port:(uint16_t *)portPtr fromAddress:(NSData *)address
{
	return [self getHost:hostPtr port:portPtr family:NULL fromAddress:address];
}

+ (BOOL)getHost:(NSString **)hostPtr port:(uint16_t *)portPtr family:(int *)afPtr fromAddress:(NSData *)address
{
	if ([address length] >= sizeof(struct sockaddr))
	{
		const struct sockaddr *addrX = (const struct sockaddr *)[address bytes];
		
		if (addrX->sa_family == AF_INET)
		{
			if ([address length] >= sizeof(struct sockaddr_in))
			{
				const struct sockaddr_in *addr4 = (const struct sockaddr_in *)(const void *)addrX;
				
				if (hostPtr) *hostPtr = [self hostFromSockaddr4:addr4];
				if (portPtr) *portPtr = [self portFromSockaddr4:addr4];
				if (afPtr)   *afPtr   = AF_INET;
				
				return YES;
			}
		}
		else if (addrX->sa_family == AF_INET6)
		{
			if ([address length] >= sizeof(struct sockaddr_in6))
			{
				const struct sockaddr_in6 *addr6 = (const struct sockaddr_in6 *)(const void *)addrX;
				
				if (hostPtr) *hostPtr = [self hostFromSockaddr6:addr6];
				if (portPtr) *portPtr = [self portFromSockaddr6:addr6];
				if (afPtr)   *afPtr   = AF_INET6;
				
				return YES;
			}
		}
	}
	
	if (hostPtr) *hostPtr = nil;
	if (portPtr) *portPtr = 0;
	if (afPtr)   *afPtr   = AF_UNSPEC;
	
	return NO;
}

@end
