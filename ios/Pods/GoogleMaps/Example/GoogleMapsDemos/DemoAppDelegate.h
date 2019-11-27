/*
 * Copyright 2016 Google Inc. All rights reserved.
 *
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this
 * file except in compliance with the License. You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF
 * ANY KIND, either express or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */

#import <UIKit/UIKit.h>

@interface DemoAppDelegate : UIResponder <
    UIApplicationDelegate,
    UISplitViewControllerDelegate>

@property(nonatomic) UIWindow *window;
@property(nonatomic) UINavigationController *navigationController;
@property(nonatomic) UISplitViewController *splitViewController;

/**
 * If the device is an iPad, this property controls the sample displayed in the
 * right side of its split view controller.
 */
@property(nonatomic) UIViewController *sample;

@end
