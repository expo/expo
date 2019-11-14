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

#import "GoogleMapsDemos/MasterViewController.h"

#import <GoogleMaps/GoogleMaps.h>
#import "GoogleMapsDemos/DemoAppDelegate.h"
#import "GoogleMapsDemos/Samples/Samples.h"


@implementation MasterViewController {
  NSArray *_demos;
  NSArray *_demoSections;
  BOOL _isPhone;
  UIPopoverController *_popover;
  UIBarButtonItem *_samplesButton;
  __weak UIViewController *_controller;
  CLLocationManager *_locationManager;
}

- (void)viewDidLoad {
  [super viewDidLoad];

  _isPhone = [[UIDevice currentDevice] userInterfaceIdiom] == UIUserInterfaceIdiomPhone;

  if (!_isPhone) {
    self.clearsSelectionOnViewWillAppear = NO;
  } else {
    UIBarButtonItem *backButton =
        [[UIBarButtonItem alloc] initWithTitle:NSLocalizedString(@"Back", @"Back")
                                         style:UIBarButtonItemStylePlain
                                        target:nil
                                        action:nil];
    [self.navigationItem setBackBarButtonItem:backButton];
  }

  self.title = NSLocalizedString(@"Maps SDK Demos", @"Maps SDK Demos");
  self.title = [NSString stringWithFormat:@"%@: %@", self.title, [GMSServices SDKLongVersion]];

  self.tableView.autoresizingMask =
      UIViewAutoresizingFlexibleHeight | UIViewAutoresizingFlexibleWidth;
  self.tableView.delegate = self;
  self.tableView.dataSource = self;

  _demoSections = [Samples loadSections];
  _demos = [Samples loadDemos];

  if (!_isPhone) {
    [self loadDemo:0 atIndex:0];
  }
}

#pragma mark - UITableViewController

- (NSInteger)numberOfSectionsInTableView:(UITableView *)tableView {
  return _demoSections.count;
}

- (CGFloat)tableView:(UITableView *)tableView heightForHeaderInSection:(NSInteger)section {
  return 35.0;
}

- (NSString *)tableView:(UITableView *)tableView titleForHeaderInSection:(NSInteger)section {
  return [_demoSections objectAtIndex:section];
}

- (NSInteger)tableView:(UITableView *)tableView numberOfRowsInSection:(NSInteger)section {
  NSArray *demosInSection = [_demos objectAtIndex:section];
  return demosInSection.count;
}

- (UITableViewCell *)tableView:(UITableView *)tableView
         cellForRowAtIndexPath:(NSIndexPath *)indexPath {
  static NSString *cellIdentifier = @"Cell";
  UITableViewCell *cell = [tableView dequeueReusableCellWithIdentifier:cellIdentifier];
  if (cell == nil) {
    cell = [[UITableViewCell alloc] initWithStyle:UITableViewCellStyleSubtitle
                                  reuseIdentifier:cellIdentifier];

    if (_isPhone) {
      [cell setAccessoryType:UITableViewCellAccessoryDisclosureIndicator];
    }
  }

  NSDictionary *demo = [[_demos objectAtIndex:indexPath.section] objectAtIndex:indexPath.row];
  cell.textLabel.text = [demo objectForKey:@"title"];
  cell.detailTextLabel.text = [demo objectForKey:@"description"];

  return cell;
}

- (void)tableView:(UITableView *)tableView didSelectRowAtIndexPath:(NSIndexPath *)indexPath {
  // The user has chosen a sample; load it and clear the selection!
  [self loadDemo:indexPath.section atIndex:indexPath.row];
  [tableView deselectRowAtIndexPath:indexPath animated:YES];
}

#pragma mark - Split view

- (void)splitViewController:(UISplitViewController *)splitController
     willHideViewController:(UIViewController *)viewController
          withBarButtonItem:(UIBarButtonItem *)barButtonItem
       forPopoverController:(UIPopoverController *)popoverController {
  _popover = popoverController;
  _samplesButton = barButtonItem;
  _samplesButton.title = NSLocalizedString(@"Samples", @"Samples");
  _samplesButton.style = UIBarButtonItemStyleDone;
  [self updateSamplesButton];
}

- (void)splitViewController:(UISplitViewController *)splitController
       willShowViewController:(UIViewController *)viewController
    invalidatingBarButtonItem:(UIBarButtonItem *)barButtonItem {
  _popover = nil;
  _samplesButton = nil;
  [self updateSamplesButton];
}

#pragma mark - Private methods

- (void)loadDemo:(NSUInteger)section atIndex:(NSUInteger)index {
  NSDictionary *demo = [[_demos objectAtIndex:section] objectAtIndex:index];
  UIViewController *controller = [[[demo objectForKey:@"controller"] alloc] init];
  _controller = controller;

  if (controller != nil) {
    controller.title = [demo objectForKey:@"title"];

    if (_isPhone) {
      [self.navigationController pushViewController:controller animated:YES];
    } else {
      [self.appDelegate setSample:controller];
      [_popover dismissPopoverAnimated:YES];
    }

    [self updateSamplesButton];
  }
}

// This method is invoked when the left 'back' button in the split view
// controller on iPad should be updated (either made visible or hidden).
// It assumes that the left bar button item may be safely modified to contain
// the samples button.
- (void)updateSamplesButton {
  _controller.navigationItem.leftBarButtonItem = _samplesButton;
}

@end
