// Copyright 2015-present 650 Industries. All rights reserved.

@interface LinkPreviewNativeNavigation: NSObject

/*
* Updates the preloaded view with the given screenId and UIResponder.
* This function will go through the responder's view hierarchy to find the screen view with the given screenId and activity state 0.
*/
- (void)updatePreloadedView:(NSString *)screenId withUiResponder:(UIResponder *)responder;

/*
* Pushes the previously preloaded view.
* This function will set the activity state of the preloaded screen view to 2
*/
- (void)pushPreloadedView;

@end

