#import "SnapshotHelper.js"

var target = UIATarget.localTarget();
var app = target.frontMostApp();
var window = app.mainWindow();

// Wait for the welcome screen and the logo to load
window.elements()['settings/title'];
target.delay(0.5);
captureLocalizedScreenshot('0-Email');

logIn();
captureLocalizedScreenshot('1-Home');

function logIn() {
  var emailField = window.textFields()['settings/email-address'];
  emailField.setValue('ide@exp.host');
  app.keyboard().typeString('\n');
  // Wait for the scene to be dismissed
  target.delay(1);
}
