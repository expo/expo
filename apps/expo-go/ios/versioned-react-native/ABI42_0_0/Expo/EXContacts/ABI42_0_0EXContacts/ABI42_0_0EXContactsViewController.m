
// Copyright 2018-present 650 Industries. All rights reserved.
#import <ABI42_0_0EXContacts/ABI42_0_0EXContactsViewController.h>
@import Contacts;

@implementation ABI42_0_0EXContactsViewController

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

@end
