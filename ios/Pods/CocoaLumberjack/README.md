<p align="center" >
  <img src="LumberjackLogo.png" title="Lumberjack logo" float=left>
</p>

CocoaLumberjack
===============
[![Build Status](https://travis-ci.org/CocoaLumberjack/CocoaLumberjack.svg?branch=master)](https://travis-ci.org/CocoaLumberjack/CocoaLumberjack)
[![Pod Version](http://img.shields.io/cocoapods/v/CocoaLumberjack.svg?style=flat)](http://cocoadocs.org/docsets/CocoaLumberjack/)
[![Carthage compatible](https://img.shields.io/badge/Carthage-compatible-4BC51D.svg?style=flat)](https://github.com/Carthage/Carthage)
[![Pod Platform](http://img.shields.io/cocoapods/p/CocoaLumberjack.svg?style=flat)](http://cocoadocs.org/docsets/CocoaLumberjack/)
[![Pod License](http://img.shields.io/cocoapods/l/CocoaLumberjack.svg?style=flat)](http://opensource.org/licenses/BSD-3-Clause)
[![Reference Status](https://www.versioneye.com/objective-c/cocoalumberjack/reference_badge.svg?style=flat)](https://www.versioneye.com/objective-c/cocoalumberjack/references)
[![codecov](https://codecov.io/gh/CocoaLumberjack/CocoaLumberjack/branch/master/graph/badge.svg)](https://codecov.io/gh/CocoaLumberjack/CocoaLumberjack)

**CocoaLumberjack** is a fast & simple, yet powerful & flexible logging framework for Mac and iOS.

### How to get started
- install via [CocoaPods](http://cocoapods.org)

##### Swift version via CocoaPods
```ruby
platform :ios, '8.0'

# You need to set target when you use CocoaPods 1.0.0 or later.
target 'SampleTarget' do 
  use_frameworks!
  pod 'CocoaLumberjack/Swift'
end
```
Note: `Swift` is a subspec which will include all the Obj-C code plus the Swift one, so this is sufficient. 
For more details about how to use Swift with Lumberjack, see [this conversation](https://github.com/CocoaLumberjack/CocoaLumberjack/issues/405).

##### Swift Usage

If you installed using CocoaPods or manually:
```swift
import CocoaLumberjack
```

```swift
DDLog.add(DDTTYLogger.sharedInstance) // TTY = Xcode console
DDLog.add(DDASLLogger.sharedInstance) // ASL = Apple System Logs

let fileLogger: DDFileLogger = DDFileLogger() // File Logger
fileLogger.rollingFrequency = TimeInterval(60*60*24)  // 24 hours
fileLogger.logFileManager.maximumNumberOfLogFiles = 7
DDLog.add(fileLogger)

...

DDLogVerbose("Verbose");
DDLogDebug("Debug");
DDLogInfo("Info");
DDLogWarn("Warn");
DDLogError("Error");
```

##### Obj-C version via CocoaPods

```ruby
platform :ios, '7.0'
pod 'CocoaLumberjack'
```

##### Obj-C usage
If you're using Lumberjack as a framework, you can `@import CocoaLumberjack`.

Otherwise, `#import <CocoaLumberjack/CocoaLumberjack.h>`

```objc
[DDLog addLogger:[DDTTYLogger sharedInstance]]; // TTY = Xcode console
[DDLog addLogger:[DDASLLogger sharedInstance]]; // ASL = Apple System Logs

DDFileLogger *fileLogger = [[DDFileLogger alloc] init]; // File Logger
fileLogger.rollingFrequency = 60 * 60 * 24; // 24 hour rolling
fileLogger.logFileManager.maximumNumberOfLogFiles = 7;
[DDLog addLogger:fileLogger];

...

DDLogVerbose(@"Verbose");
DDLogDebug(@"Debug");
DDLogInfo(@"Info");
DDLogWarn(@"Warn");
DDLogError(@"Error");
```

##### Installation with Carthage (iOS 8+)

[Carthage](https://github.com/Carthage/Carthage) is a lightweight dependency manager for Swift and Objective-C. It leverages CocoaTouch modules and is less invasive than CocoaPods.

To install with Carthage, follow the instruction on [Carthage](https://github.com/Carthage/Carthage)

Cartfile
```
github "CocoaLumberjack/CocoaLumberjack"
```

- or [install manually](Documentation/GettingStarted.md#manual-installation)
- read the [Getting started](Documentation/GettingStarted.md) guide, check out the [FAQ](Documentation/FAQ.md) section or the other [docs](Documentation/)
- if you find issues or want to suggest improvements, create an issue or a pull request
- for all kinds of questions involving CocoaLumberjack, use the [Google group](http://groups.google.com/group/cocoalumberjack) or StackOverflow (use [#lumberjack](http://stackoverflow.com/questions/tagged/lumberjack)).

### CocoaLumberjack 3

#### Migrating to 3.x

* To be determined

### Features

#### Lumberjack is Fast & Simple, yet Powerful & Flexible.

It is similar in concept to other popular logging frameworks such as log4j, yet is designed specifically for Objective-C, and takes advantage of features such as multi-threading, grand central dispatch (if available), lockless atomic operations, and the dynamic nature of the Objective-C runtime.

#### Lumberjack is Fast

In most cases it is an order of magnitude faster than NSLog.

#### Lumberjack is Simple

It takes as little as a single line of code to configure lumberjack when your application launches. Then simply replace your NSLog statements with DDLog statements and that's about it. (And the DDLog macros have the exact same format and syntax as NSLog, so it's super easy.)

#### Lumberjack is Powerful:

One log statement can be sent to multiple loggers, meaning you can log to a file and the console simultaneously. Want more? Create your own loggers (it's easy) and send your log statements over the network. Or to a database or distributed file system. The sky is the limit.

#### Lumberjack is Flexible:

Configure your logging however you want. Change log levels per file (perfect for debugging). Change log levels per logger (verbose console, but concise log file). Change log levels per xcode configuration (verbose debug, but concise release). Have your log statements compiled out of the release build. Customize the number of log levels for your application. Add your own fine-grained logging. Dynamically change log levels during runtime. Choose how & when you want your log files to be rolled. Upload your log files to a central server. Compress archived log files to save disk space...

### This framework is for you if:

-   You're looking for a way to track down that impossible-to-reproduce bug that keeps popping up in the field.
-   You're frustrated with the super short console log on the iPhone.
-   You're looking to take your application to the next level in terms of support and stability.
-   You're looking for an enterprise level logging solution for your application (Mac or iPhone).

### Documentation

- **[Get started using Lumberjack](Documentation/GettingStarted.md)**<br/>
- [Different log levels for Debug and Release builds](Documentation/XcodeTricks.md)<br/>
- [Different log levels for each logger](Documentation/PerLoggerLogLevels.md)<br/>
- [Use colors in the Xcode debugging console](Documentation/XcodeColors.md)<br/>
- [Write your own custom formatters](Documentation/CustomFormatters.md)<br/>
- [FAQ](Documentation/FAQ.md)<br/>
- [Analysis of performance with benchmarks](Documentation/Performance.md)<br/>
- [Common issues you may encounter and their solutions](Documentation/ProblemSolution.md)<br/>
- [AppCode support](Documentation/AppCode-support.md)
- **[Full Lumberjack documentation](Documentation/)**<br/>

### Requirements 
The current version of Lumberjack requires:
- Xcode 8 or later
- Swift 3.0 or later
- iOS 5 or later
- OS X 10.7 or later
- WatchOS 2 or later
- TVOS 9 or later

#### Backwards compability
- for Xcode 7.3 and Swift 2.3, use the 2.4.0 version
- for Xcode 7.3 and Swift 2.2, use the 2.3.0 version
- for Xcode 7.2 and 7.1, use the 2.2.0 version
- for Xcode 7.0 or earlier, use the 2.1.0 version
- for Xcode 6 or earlier, use the 2.0.x version
- for OS X < 10.7 support, use the 1.6.0 version

### Communication

- If you **need help**, use [Stack Overflow](http://stackoverflow.com/questions/tagged/lumberjack). (Tag 'lumberjack')
- If you'd like to **ask a general question**, use [Stack Overflow](http://stackoverflow.com/questions/tagged/lumberjack).
- If you **found a bug**, open an issue.
- If you **have a feature request**, open an issue.
- If you **want to contribute**, submit a pull request.

### Author
- [Robbie Hanson](https://github.com/robbiehanson)
- Love the project? Wanna buy me a coffee? (or a beer :D) [![donation](http://www.paypal.com/en_US/i/btn/btn_donate_SM.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=UZRA26JPJB3DA)

### Collaborators
- [Ernesto Rivera](https://github.com/rivera-ernesto)
- [Dmitry Vorobyov](https://github.com/dvor)
- [Bogdan Poplauschi](https://github.com/bpoplauschi)
- [C.W. Betts](https://github.com/MaddTheSane)

### License
- CocoaLumberjack is available under the BSD license. See the [LICENSE file](https://github.com/CocoaLumberjack/CocoaLumberjack/blob/master/LICENSE.txt).

### Architecture

<p align="center" >
    <img src="Documentation/CocoaLumberjackClassDiagram.png" title="CocoaLumberjack class diagram">
</p>
