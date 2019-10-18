This is a little library to access the embedded provisioning profile in iOS apps.

    NSString *mobileprovisionPath = [[[NSBundle mainBundle] bundlePath]
        stringByAppendingPathComponent:@"embedded.mobileprovision"];
    TCMobileProvision *mobileprovision = [[TCMobileProvision alloc] initWithData:[NSData dataWithContentsOfFile:mobileprovisionPath]];
    NSString *profileId = mobileprovision.dict[@"UUID"] ?: @"simulator";

The code is released under the Apache License 2.0.