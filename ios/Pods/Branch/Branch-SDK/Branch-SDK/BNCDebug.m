/**
 @file          BNCDebug.m
 @package       Branch-SDK
 @brief         Debugging Support.

 @author        Edward Smith
 @date          October 2016
 @copyright     Copyright © 2016 Branch. All rights reserved.
*/

#import "BNCDebug.h"
#if __has_feature(modules)
@import Darwin.sys.sysctl;
@import ObjectiveC.runtime;
#else
#import <sys/sysctl.h>
#import <objc/runtime.h>
#endif

BOOL BNCDebuggerIsAttached() {
    //  From an Apple tech note that I've lost --EB Smith

    //  Returns true if the current process is being debugged (either
    //  running under the debugger or has a debugger attached post facto).

    int                 junk;
    int                 mib[4];
    struct kinfo_proc   info;
    size_t              size;

    //  Initialize the flags so that, if sysctl fails for some bizarre
    //  reason, we get a predictable result.

    info.kp_proc.p_flag = 0;

    //  Initialize mib, which tells sysctl the info we want, in this case
    //  we're looking for information about a specific process ID.

    mib[0] = CTL_KERN;
    mib[1] = KERN_PROC;
    mib[2] = KERN_PROC_PID;
    mib[3] = getpid();

    //  Call sysctl.

    size = sizeof(info);
    junk = sysctl(mib, sizeof(mib) / sizeof(*mib), &info, &size, NULL, 0);
    if (junk != 0) {
        NSLog(@"Program error in BNCDebuggerIsAttached. Junk != 0!");
    }

    //  We're being debugged if the P_TRACED flag is set.

    return ( (info.kp_proc.p_flag & P_TRACED) != 0 );
}

NSString * _Nonnull BNCDebugStringFromObject(id _Nullable instance) {
    //  Dump the class --

    if (!instance) return @"Object is nil.\n";

    const char* superclassname = "<nil>";
    Class class = object_getClass(instance);
    Class superclass = class_getSuperclass(class);
    if (superclass) superclassname = class_getName(superclass);
    if (!superclassname) superclassname = "<nil>";

    NSMutableString *result = [NSMutableString stringWithCapacity:512];
    if (class_isMetaClass(class)) {
        [result appendFormat:@"\nClass %p is class '%s' of class '%s':\n",
            (void*)instance, class_getName(class), superclassname];
        class = instance;
    } else {
        [result appendFormat:@"\nInstance %p is of class '%s' of class '%s':\n",
            (void*)instance, class_getName(class), superclassname];
    }

    //  Ivars --

    #define isTypeOf(encoding, type) \
        (strncmp(encoding, @encode(type), strlen(encoding)) == 0)

    #define AppendValueOfType(type, format) \
        if (isTypeOf(encoding, type)) { \
            if (ivarPtr) { \
                [result appendFormat:@"\tIvar '%s' type '%s' value '"format"'.\n", \
                    ivarName, #type, *((type*)ivarPtr)]; \
            } else { \
                [result appendFormat:@"\tIvar '%s' type '%s'.\n", \
                    ivarName, #type]; \
            } \
        } else

    uint count = 0;
    Ivar *ivars = class_copyIvarList(class, &count);
    for (uint i = 0; i < count; ++i) {
        const char* encoding = ivar_getTypeEncoding(ivars[i]);
        const char* ivarName = ivar_getName(ivars[i]);
        const void* ivarPtr = nil;
        if (class == instance) {
            //  instance is a class, so there aren't any ivar values.
        } else if (encoding[0] == '@' || encoding[0] == '#') {
            ivarPtr = (__bridge void*) object_getIvar(instance, ivars[i]);
        } else {
            ivarPtr = (void*) (((__bridge void*)instance) + ivar_getOffset(ivars[i]));
        }

        if (encoding[0] == '@') {
            if (ivarPtr)
                [result appendFormat:@"\tIvar '%s' type '%@' value '%@'.\n",
                    ivarName, NSStringFromClass(((__bridge id<NSObject>)ivarPtr).class), ivarPtr];
            else {
                NSString *className = [NSString stringWithFormat:@"%s", encoding];
                if ([className hasPrefix:@"@\""])
                    className = [className substringFromIndex:2];
                if ([className hasSuffix:@"\""])
                    className = [className substringToIndex:className.length-1];
                [result appendFormat:@"\tIvar '%s' type '%@'.\n", ivarName, className];
            }
        } else if (isTypeOf(encoding, Class)) {
            if (ivarPtr)
                [result appendFormat:@"\tIvar '%s' type 'class' value '%@'.\n",
                    ivarName, NSStringFromClass((__bridge Class _Nonnull)(ivarPtr))];
            else
                [result appendFormat:@"\tIvar '%s' type 'class'.\n",
                    ivarName];
        } else if (isTypeOf(encoding, char*)) {
            if (ivarPtr)
                [result appendFormat:@"\tIvar '%s' type 'char*' value '%s'.\n",
                    ivarName, *(char**)ivarPtr];
            else
                [result appendFormat:@"\tIvar '%s' type 'char*'.\n",
                    ivarName];
        } else if (isTypeOf(encoding, BOOL)) {
            if (ivarPtr)
                [result appendFormat:@"\tIvar '%s' type 'BOOL' value '%s'.\n",
                    ivarName, (*(BOOL*)ivarPtr)?"YES":"NO"];
            else
                [result appendFormat:@"\tIvar '%s' type 'BOOL'.\n",
                    ivarName];
        } else if (isTypeOf(encoding, int)) {
            if (ivarPtr)
                [result appendFormat:@"\tIvar '%s' type '%s' value '%d'.\n",
                    ivarName, "int", *((int*)ivarPtr)];
            else
                [result appendFormat:@"\tIvar '%s' type '%s'.\n",
                    ivarName, "int"];
        } else
            // clang-format off
            AppendValueOfType(float, "%f")
            AppendValueOfType(double, "%f")
            AppendValueOfType(long double, "%Lf")
            AppendValueOfType(char, "%c")
            AppendValueOfType(int, "%d")
            AppendValueOfType(short, "%hd")
            AppendValueOfType(long, "%ld")
            AppendValueOfType(long long, "%lld")
            AppendValueOfType(unsigned char, "%c")
            AppendValueOfType(unsigned int, "%u")
            AppendValueOfType(unsigned short, "%hu")
            AppendValueOfType(unsigned long, "%lu")
            AppendValueOfType(unsigned long long, "%llu")
            [result appendFormat:@"\tIvar '%s' type '%s' (un-handled type).\n",
                                 ivarName,
                                 encoding];
            // clang-format off
    }
    if (ivars) free(ivars);

    #undef AppendValueOfType
    #undef isTypeOf

    //  Properties --

    count = 0;
    objc_property_t *properties = class_copyPropertyList(class, &count);
    for (int i = 0; i < count; ++i)
        [result appendFormat:@"\tProperty name: '%s'.\n", property_getName(properties[i])];
    if (properties) free(properties);

    //  Class methods --

    count = 0;
    Method *methods = class_copyMethodList(object_getClass(class), &count);
    for (int i = 0; i < count; ++i)
        [result appendFormat:@"\tClass method name: '%s'.\n",
            sel_getName(method_getName(methods[i]))];
    if (methods) free(methods);

    //  Instance methods --

    count = 0;
    methods = class_copyMethodList(class, &count);
    for (int i = 0; i < count; ++i)
        [result appendFormat:@"\tMethod name: '%s'.\n",
            sel_getName(method_getName(methods[i]))];
    if (methods) free(methods);

    return result;
}

NSArray<NSString*> * _Nonnull BNCDebugArrayOfReqisteredClasses() {
    //  Add all loaded classes to the NSString array:

    int numClasses = 0;
    Class * classes = NULL;

    numClasses = objc_getClassList(NULL, 0);
    if (numClasses <= 0) return @[];

    classes = (__unsafe_unretained Class*) malloc(sizeof(Class) * numClasses);
    numClasses = objc_getClassList(classes, numClasses);

    NSMutableArray<NSString*> *result = [[NSMutableArray alloc] initWithCapacity:numClasses];

    Class *class = classes;
    for (int i = 0; i < numClasses; ++i) {
        NSString* s = NSStringFromClass(*class);
        if (s) [result addObject:s];
        ++class;
    }

    free(classes);
    return result;
}
