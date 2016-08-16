function wait_for_loading_indicator_to_be_finished()
{
  try {
    re = UIATarget.localTarget().frontMostApp().statusBar().elements()[2].rect()
    re2 = UIATarget.localTarget().frontMostApp().statusBar().elements()[3].rect()
    while ((re['size']['width'] == 10 && re['size']['height'] == 20) ||
           (re2['size']['width'] == 10 && re2['size']['height'] == 20))
     {
      UIALogger.logMessage("Loading indicator is visible... waiting")
      UIATarget.localTarget().delay(1)
      re = UIATarget.localTarget().frontMostApp().statusBar().elements()[2].rect()
      re2 = UIATarget.localTarget().frontMostApp().statusBar().elements()[3].rect()
    }
  } catch (e) {}
}

function isTablet()
{
  return !(UIATarget.localTarget().model().match(/iPhone/))
}

function captureLocalizedScreenshot(name) {
  wait_for_loading_indicator_to_be_finished();

  var target = UIATarget.localTarget();
  var model = target.model();
  var rect = target.rect();
  var deviceOrientation = target.deviceOrientation();
  
  var theSize = (rect.size.width > rect.size.height) ? rect.size.width.toFixed() : rect.size.height.toFixed();

  if (model.match(/iPhone/)) 
  {
    if (theSize > 667) {
      model = "iPhone6Plus";
    } else if (theSize == 667) {
      model = "iPhone6";
    } else if (theSize == 568){
      model = "iPhone5";
    } else {
    model = "iPhone4";
    }
  } 
  else 
  {
    model = "iPad";
  }

  var orientation = "portrait";
  if (deviceOrientation == UIA_DEVICE_ORIENTATION_LANDSCAPELEFT) {
    orientation = "landscapeleft";
  } else if (deviceOrientation == UIA_DEVICE_ORIENTATION_LANDSCAPERIGHT) {
    orientation = "landscaperight";
  } else if (deviceOrientation == UIA_DEVICE_ORIENTATION_PORTRAIT_UPSIDEDOWN) {
    orientation = "portrait_upsidedown";
  }

  var result = target.host().performTaskWithPathArgumentsTimeout("/usr/bin/printenv" , ["SNAPSHOT_LANGUAGE"], 5);
  var language = result.stdout.substring(0, result.stdout.length - 1);

  var parts = [language, model, name, orientation];
  target.captureScreenWithName(parts.join("-"));
}
