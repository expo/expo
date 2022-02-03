
// Copyright 2018-present 650 Industries. All rights reserved.
#import <EXContacts/EXContactsViewController.h>
@import Contacts;

@interface EXContactsViewController()

@property (nonatomic, copy) void (^onViewDisappeared)(void);

@end

@implementation EXContactsViewController

- (void)handleViewDisappeared: (void (^)(void))handler
{
  self.onViewDisappeared = handler;
}

- (void)setCloseButton:(NSString *)title
{
  if (!self.navigationItem.leftBarButtonItem) {
    self.navigationItem.leftBarButtonItem = [[UIBarButtonItem alloc] initWithTitle:title
                                                                             style:UIBarButtonItemStylePlain
                                                                            target:self
                                                                            action:@selector(closeController)];
  } else {
    [((UIBarButtonItem * )self.navigationItem.leftBarButtonItem) setTitle:title];
  }
}

- (void)closeController {
  [self dismissViewControllerAnimated:YES completion:nil];
}

- (void)viewDidDisappear:(BOOL)animated {
  [super viewDidDisappear:animated];
  if (self.onViewDisappeared) {
    self.onViewDisappeared();
  }
}

@end
