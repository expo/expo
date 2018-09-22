# Lottie for iOS, macOS (and [Android](https://github.com/airbnb/lottie-android) and [React Native](https://github.com/airbnb/lottie-react-native))

### Table of Contents
- [Introduction](#introduction)
- [Installing Lottie](#installing-lottie)
- [iOS Sample App](#ios-sample-app)
- [macOS Sample App](#macos-sample-app)
- [Objective C Examples](#objective-c-examples)
- [Swift Examples](#swift-examples)
- [Debugging Lottie](#debugging)
- [iOS View Controller Transitioning](#ios-view-controller-transitioning)
- [Changing Animations At Runtime](#changing-animations-at-runtime)
- [Animated Controls and Switches](#animated-controls-and-switches)
- [Adding Subviews to Animation](#adding-views-to-an-animation-at-runtime)
- [Supported After Effects Features](#supported-after-effects-features)
- [Currently Unsupported After Effects Features](#currently-unsupported-after-effects-features)
- [Community Contributions](#community-contributions)
- [Alternatives](#alternatives)
- [Why is it called Lottie?](#why-is-it-called-lottie)
- [Contributing](#contributing)
- [Issues or feature requests?](#issues-or-feature-requests)


## Introduction

Lottie is a mobile library for Android and iOS that parses [Adobe After Effects](http://www.adobe.com/products/aftereffects.html) animations exported as json with [bodymovin](https://github.com/bodymovin/bodymovin) and renders the vector animations natively on mobile and through React Native!

For the first time, designers can create **and ship** beautiful animations without an engineer painstakingly recreating it by hand.
Since the animation is backed by JSON they are extremely small in size but can be large in complexity!
Animations can be played, resized, looped, sped up, slowed down, reversed, and even interactively scrubbed.
Lottie can play or loop just a portion of the animation as well, the possibilities are endless!
Animations can even be ***changed at runtime*** in various ways! Change the color, position or any keyframable value!
Lottie also supports native UIViewController Transitions out of the box!

Here is just a small sampling of the power of Lottie

![Example1](_Gifs/Examples1.gif)
![Example2](_Gifs/Examples2.gif)

<img src="_Gifs/Community 2_3.gif" />

![Example3](_Gifs/Examples3.gif)

![Abcs](_Gifs/Examples4.gif)

## Installing Lottie

### Github Repo
You can pull the [Lottie Github Repo](https://github.com/airbnb/lottie-ios/) and include the Lottie.xcodeproj to build a dynamic or static library.

### Cocoapods
Get [Cocoapods](https://cocoapods.org/)
Add the pod to your podfile
```
pod 'lottie-ios'
```
run
```
pod install
```

After installing the cocoapod into your project import Lottie with
Objective C
`#import <Lottie/Lottie.h>` 
Swift
`import Lottie`

### Carthage
Get [Carthage](https://github.com/Carthage/Carthage)

Add Lottie to your Cartfile
```
github "airbnb/lottie-ios" "master"
```
run
```
carthage update
```

In your application targets “General” tab under the “Linked Frameworks and Libraries” section, drag and drop lottie-ios.framework from the Carthage/Build/iOS directory that `carthage update` produced.

## iOS Sample App

Clone this repo and try out [the Sample App](https://github.com/airbnb/lottie-ios/tree/master/Example)
The repo can build a macOS Example and an iOS Example

The iOS Example App demos several of the features of Lottie

![Example 1](_Gifs/iosexample1.png)![Example 2](_Gifs/iosexample2.png)
![Example 3](_Gifs/iosexample3.png)

The animation Explorer allows you to scrub, play, loop, and resize animations.
Animations can be loaded from the app bundle or from [Lottie Files](http://www.lottiefiles.com) using the built in QR Code reader.

## macOS Sample App

Clone this repo and try out [the Sample App](https://github.com/airbnb/lottie-ios/tree/master/Example)
The repo can build a macOS Example and an iOS Example

![Lottie Viewer](_Gifs/macexample.png)

The Lottie Viewer for macOS allows you to drag and drop JSON files to open, play, scrub and loop animations. This app is backed by the same animation code as the iOS app, so you will get an accurate representation of Mac and iOS animations.


## Objective C Examples


Lottie animations can be loaded from bundled JSON or from a URL
To bundle JSON just add it and any images that the animation requires to your target in xcode.

```objective-c
LOTAnimationView *animation = [LOTAnimationView animationNamed:@"Lottie"];
[self.view addSubview:animation];
[animation playWithCompletion:^(BOOL animationFinished) {
  // Do Something
}];
```

If you are working with multiple bundles you can use.

```objective-c
LOTAnimationView *animation = [LOTAnimationView animationNamed:@"Lottie" inBundle:[NSBundle YOUR_BUNDLE]];
[self.view addSubview:animation];
[animation playWithCompletion:^(BOOL animationFinished) {
  // Do Something
}];
```

Or you can load it programmatically from a NSURL
```objective-c
LOTAnimationView *animation = [[LOTAnimationView alloc] initWithContentsOfURL:[NSURL URLWithString:URL]];
[self.view addSubview:animation];
```

Lottie supports the iOS `UIViewContentModes` aspectFit, aspectFill and scaleFill

You can also set the animation progress interactively.
```objective-c
CGPoint translation = [gesture getTranslationInView:self.view];
CGFloat progress = translation.y / self.view.bounds.size.height;
animationView.animationProgress = progress;
```

Or you can play just a portion of the animation:
```objective-c
[lottieAnimation playFromProgress:0.25 toProgress:0.5 withCompletion:^(BOOL animationFinished) {
  // Do Something
}];
```
## Swift Examples

Lottie animations can be loaded from bundled JSON or from a URL
To bundle JSON just add it and any images that the animation requires to your target in xcode.

```swift
let animationView = LOTAnimationView(name: "LottieLogo")
self.view.addSubview(animationView)
animationView.play{ (finished) in
  // Do Something
}
```

If your animation is in another bundle you can use
```swift
let animationView = LOTAnimationView(name: "LottieLogo" bundle:yourBundle)
self.view.addSubview(animationView)
animationView.play()
```

Or you can load it asynchronously from a URL
```swift
let animationView = LOTAnimationView(contentsOf: WebURL)
self.view.addSubview(animationView)
animationView.play()
```

You can also set the animation progress interactively.
```swift
let translation = gesture.getTranslationInView(self.view)
let progress = translation.y / self.view.bounds.size.height;
animationView.animationProgress = progress
```

Or you can play just a portion of the animation:
```swift
animationView.play(fromProgress: 0.25, toProgress: 0.5, withCompletion: nil)
```

## iOS View Controller Transitioning

Lottie comes with a `UIViewController` animation-controller for making custom viewController transitions!

![Transition1](_Gifs/transitionMasked.gif)
![Transition2](_Gifs/transitionPosition.gif)

Just become the delegate for a transition

```objective-c
- (void)_showTransitionA {
  ToAnimationViewController *vc = [[ToAnimationViewController alloc] init];
  vc.transitioningDelegate = self;
  [self presentViewController:vc animated:YES completion:NULL];
}
```

And implement the delegate methods with a `LOTAnimationTransitionController`

```objective-c
#pragma mark -- View Controller Transitioning

- (id<UIViewControllerAnimatedTransitioning>)animationControllerForPresentedController:(UIViewController *)presented presentingController:(UIViewController *)presenting sourceController:(UIViewController *)source {
  LOTAnimationTransitionController *animationController = [[LOTAnimationTransitionController alloc] initWithAnimationNamed:@"vcTransition1" fromLayerNamed:@"outLayer" toLayerNamed:@"inLayer" applyAnimationTransform:NO];
  return animationController;
}

- (id<UIViewControllerAnimatedTransitioning>)animationControllerForDismissedController:(UIViewController *)dismissed {
  LOTAnimationTransitionController *animationController = [[LOTAnimationTransitionController alloc] initWithAnimationNamed:@"vcTransition2" fromLayerNamed:@"outLayer" toLayerNamed:@"inLayer" applyAnimationTransform:NO];
  return animationController;
}

```

By setting `applyAnimationTransform` to YES you can make the Lottie animation move the from and to view controllers. They will be positioned at the origin of the layer. When set to NO Lottie just masks the view controller with the specified layer while resepecting z order.

## Debugging
Lottie has a couple of debugging features to know about. 
When an animation is loaded unsupported features are logged out in the console with their function names.

If you checkout LOTHelpers.h you will see two debug flags. `ENABLE_DEBUG_LOGGING` and `ENABLE_DEBUG_SHAPES`. 
`ENABLE_DEBUG_LOGGING` increases the verbosity of Lottie Logging. It logs anytime an animation node is set during animation. If your animation if not working, turn this on and play your animation. The console log might give you some clues as to whats going on.

`ENABLE_DEBUG_SHAPES` Draws a colored square for the anchor-point of every layer and shape. This is helpful to see if anything is on screen.

### Keypaths

LOTAnimationView provides `- (void)logHierarchyKeypaths` which will recursively log all settable keypaths for the animation. This is helpful for changing animationations at runtime.

## Adding Views to an Animation at Runtime

Not only can you [change animations at runtime](#changing-animations-at-runtime) with Lottie, you can also add custom UI to a LOTAnimation at runtime.
The example below shows some advance uses of this to create a dynamic image loader.

## A Dynamic Image Loading Spinner

![Spinner](/_Gifs/spinner.gif)

The example above shows a single LOTAnimationView that is set with a loading spinner animation. The loading spinner loops a portion of its animation while an image is downloaded asynchronously. When the download is complete, the image is added to the animation and the rest of the animation is played seamlessly. The image is cleanly animated in and a completion block is called.

![Spinner_Alt](/_Gifs/spinner_Alternative.gif)

Now, the animation has been changed by a designer and needs to be updated. All that is required is updating the JSON file in the bundle. No code change needed!

![Spinner_Dark](/_Gifs/spinner_DarkMode.gif)

Here, the design has decided to add a 'Dark Mode' to the app. Just a few lines of code change the color of the animation at runtime.


Pretty powerful eh?

Check out the code below for an example!

```swift

import UIKit
import Lottie

class ViewController: UIViewController {
  
  var animationView: LOTAnimationView = LOTAnimationView(name: "SpinnerSpin");
  
  override func viewDidLoad() {
    super.viewDidLoad()
    
    // Setup our animaiton view
    animationView.contentMode = .scaleAspectFill
    animationView.frame = CGRect(x: 20, y: 20, width: 200, height: 200)

    self.view.addSubview(animationView)
    // Lets change some of the properties of the animation
    // We arent going to use the MaskLayer, so lets just hide it
    animationView.setValue(0, forKeypath: "MaskLayer.Ellipse 1.Transform.Opacity", atFrame: 0)
    // All of the strokes and fills are white, lets make them DarkGrey
    animationView.setValue(UIColor.darkGray, forKeypath: "OuterRing.Stroke.Color", atFrame: 0)
    animationView.setValue(UIColor.darkGray, forKeypath: "InnerRing.Stroke.Color", atFrame: 0)
    animationView.setValue(UIColor.darkGray, forKeypath: "InnerRing.Fill.Color", atFrame: 0)
    
    // Lets turn looping on, since we want it to repeat while the image is 'Downloading'
    animationView.loopAnimation = true
    // Now play from 0 to 0.5 progress and loop indefinitely.
    animationView.play(fromProgress: 0, toProgress: 0.5, withCompletion: nil)
    
    // Lets simulate a download that finishes in 4 seconds.
    let dispatchTime = DispatchTime.now() + 4.0
    DispatchQueue.main.asyncAfter(deadline: dispatchTime) {
      self.simulateImageDownloaded()
    }
  }
  
  func simulateImageDownloaded() {
    // Our downloaded image
    let image = UIImage(named: "avatar.jpg")
    let imageView = UIImageView(image: image)

    // We want the image to show up centered in the animation view at 150Px150P
    // Convert that rect to the animations coordinate space
    // The origin is set to -75, -75 because the origin is centered in the animation view
    let imageRect = animationView.convert(CGRect(x: -75, y: -75, width: 150, height: 150), toLayerNamed: nil)
    
    // Setup our image view with the rect and add rounded corners
    imageView.frame = imageRect
    imageView.layer.masksToBounds = true
    imageView.layer.cornerRadius = imageRect.width / 2;
    
    // Now we set the completion block on the currently running animation
    animationView.completionBlock = { (result: Bool) in ()
      // Add the image view to the layer named "TransformLayer"
      self.animationView.addSubview(imageView, toLayerNamed: "TransformLayer", applyTransform: true)
      // Now play the last half of the animation
      self.animationView.play(fromProgress: 0.5, toProgress: 1, withCompletion: { (complete: Bool) in
        // Now the animation has finished and our image is displayed on screen
        print("Image Downloaded and Displayed")
      })
    }
    
    // Turn looping off. Once the current loop finishes the animation will stop 
    // and the completion block will be called.
    animationView.loopAnimation = false
  }
  
}

```

## Changing Animations At Runtime

Lottie can do more than just play beautiful animations. Lottie allows you to **change** animations at runtime.

### Say we want to create 4 toggle switches.
![Toggle](_Gifs/switch_Normal.gif)
Its easy to create the four switches and play them:

```swift
let animationView = LOTAnimationView(name: "toggle");
self.view.addSubview(animationView)
animationView.frame.origin.x = 40
animationView.frame.origin.y = 20
animationView.autoReverseAnimation = true
animationView.loopAnimation = true
animationView.play()

let animationView2 = LOTAnimationView(name: "toggle");
self.view.addSubview(animationView2)
animationView2.frame.origin.x = 40
animationView2.frame.origin.y = animationView.frame.maxY + 4
animationView2.autoReverseAnimation = true
animationView2.loopAnimation = true
animationView2.play()

let animationView3 = LOTAnimationView(name: "toggle");
self.view.addSubview(animationView3)
animationView3.frame.origin.x = 40
animationView3.frame.origin.y = animationView2.frame.maxY + 4
animationView3.autoReverseAnimation = true
animationView3.loopAnimation = true
animationView3.play()

let animationView4 = LOTAnimationView(name: "toggle");
self.view.addSubview(animationView4)
animationView4.frame.origin.x = 40
animationView4.frame.origin.y = animationView3.frame.maxY + 4
animationView4.autoReverseAnimation = true
animationView4.loopAnimation = true
animationView4.play()

```
### Now lets change their colors
![Recolored Toggle](_Gifs/switch_BgColors.gif)
```swift
animationView2.setValue(UIColor.green, forKeypath: "BG-On.Group 1.Fill 1.Color", atFrame: 0)
animationView3.setValue(UIColor.red, forKeypath: "BG-On.Group 1.Fill 1.Color", atFrame: 0)
animationView4.setValue(UIColor.orange, forKeypath: "BG-On.Group 1.Fill 1.Color", atFrame: 0)
```

```objective-c
[animationView2 setValue:[UIColor greenColor] forKeypath:@"BG-On.Group 1.Fill 1.Color" atFrame:@0];
```
The keyPath is a dot separated path of layer and property names from After Effects.
LOTAnimationView provides `- (void)logHierarchyKeypaths` which will recursively log all settable keypaths for the animation.
![Key Path](_Gifs/aftereffectskeypath.png)
"BG-On.Group 1.Fill 1.Color"

### Now lets change a couple of properties
![Multiple Colors](_Gifs/switch_MultipleBgs.gif)
```swift
animationView2.setValue(UIColor.green, forKeypath: "BG-On.Group 1.Fill 1.Color", atFrame: 0)
animationView2.setValue(UIColor.red, forKeypath: "BG-Off.Group 1.Fill 1.Color", atFrame: 0)
```

Lottie allows you to change **any** property that is animatable in After Effects. If a keyframe does not exist, a linear keyframe is created for you. If a keyframe does exist then just its data is replaced.

## Animated Controls and Switches

![Animated Buttons](_Gifs/switchTest.gif)

Lottie also has a custom subclass of UIControl for creating custom animatable interactive controls.
Currently Lottie has `LOTAnimatedSwitch` which is a toggle style switch control. Tapping on the switch plays either the On-Off or Off-On animation and sends out a UIControlStateValueChanged broadcast to all targets. It is used in the same way UISwitch is used with a few additions to setup the animation with Lottie.

You initialize the switch either using the conveneince method or by supplying the animation directly.

```
// Convenience
LOTAnimatedSwitch *toggle1 = [LOTAnimatedSwitch switchNamed:@"Switch"];
 
// Manually 
LOTComposition *comp = [LOTComposition animationNamed:@"Switch"];
LOTAnimatedSwitch *toggle1 = [[LOTAnimatedSwitch alloc] initWithFrame:CGRectZero];
[toggle1 setAnimationComp:comp];
```

You can also specify a specific portion of the animation's timeline for the On and Off animation.
By default `LOTAnimatedSwitch` will play the animation forward for On and backwards for off.

Lets say that the supplied animation animates ON from 0.5-1 progress and OFF from 0-0.5:

```
/// On animation is 0.5 to 1 progress.
[toggle1 setProgressRangeForOnState:0.5 toProgress:1];

/// Off animation is 0 to 0.5 progress.
[toggle1 setProgressRangeForOffState:0 toProgress:0.5];
```

Also, all LOTAnimatedControls add support for changing appearance for state changes. This requires some setup in After Effects. Lottie will switch visible animated layers based on the controls state. This can be used to have Disabled, selected, or Highlighted states. These states are associated with layer names in After Effects, and are dynamically displayed as the control changes states.

Lets say we have a toggle switch with a Normal and Disabled state. In Effects we have a composition that contains Precomps of the regular "Button" and disabled "Disabled" states. They have different visual styles.

![Regular](_Gifs/switch_enabled.png)
![Disabled](_Gifs/switch_disabled.png)

Now in code we can associate `UIControlState` with these layers

```
// Specify the layer names for different states
[statefulSwitch setLayerName:@"Button" forState:UIControlStateNormal];
[statefulSwitch setLayerName:@"Disabled" forState:UIControlStateDisabled];

// Changes visual appearance by switching animation layer to "Disabled"
statefulSwitch.enabled = NO;

// Changes visual appearance by switching animation layer to "Button"
statefulSwitch.enabled = YES;
```

## Supported After Effects Features

### Keyframe Interpolation

---

* Linear Interpolation
* Bezier Interpolation
* Hold Interpolation
* Rove Across Time
* Spatial Bezier

### Solids

---

* Transform Anchor Point
* Transform Position
* Transform Scale
* Transform Rotation
* Transform Opacity

### Masks

---

* Path
* Opacity
* Multiple Masks (additive, subtractive and intersection)

### Track Mattes

---

* Alpha Matte

### Parenting

---

* Multiple Parenting
* Nulls

### Shape Layers

---

* Anchor Point
* Position
* Scale
* Rotation
* Opacity
* Path
* Group Transforms (Anchor point, position, scale etc)
* Rectangle (All properties)
* Eclipse (All properties)
* Multiple paths in one group
* Even-Odd winding paths
* Reverse Fill Rule

#### Stroke (shape layer)

---

* Stroke Color
* Stroke Opacity
* Stroke Width
* Line Cap
* Dashes (Now Animated!)

#### Fill (shape layer)

---

* Fill Color
* Fill Opacity

#### Trim Paths (shape layer)

---

* Trim Paths Start
* Trim Paths End
* Trim Paths Offset

### Repeaters

---

* Supports repeater transforms
* Offset currently not supported.

### Gradients

---

* Support for Linear Gradients
* Support for Radial Gradients

### Polystar and Polygon

---

* Supported! Theres a known bug if the roundness is greater than 100 percent.

#### Layer Features

---

* Precomps
* Image Layers
* Shape Layers
* Null Layers
* Solid Layers
* Parenting Layers
* Alpha Matte Layers

## Currently Unsupported After Effects Features

* Merge Shapes
* Alpha Inverted Masks
* Trim Shapes Individually feature of Trim Paths
* Expressions
* 3d Layer support
* Time remapping / Layer Reverse
* Layer Blend Modes
* Layer Effects


## Community Contributions
 * [Xamarin bindings](https://github.com/martijn00/LottieXamarin)
 * [NativeScript bindings](https://github.com/bradmartin/nativescript-lottie)
 * [Appcelerator Titanium bindings](https://github.com/m1ga/ti.animation)
 * macOS Support added by [Alex Pawlowski](https://github.com/pawlowskialex)

## Alternatives
1. Build animations by hand. Building animations by hand is a huge time commitment for design and engineering across Android and iOS. It's often hard or even impossible to justify spending so much time to get an animation right.
2. [Facebook Keyframes](https://github.com/facebookincubator/Keyframes). Keyframes is a wonderful new library from Facebook that they built for reactions. However, Keyframes doesn't support some of Lottie's features such as masks, mattes, trim paths, dash patterns, and more.
2. Gifs. Gifs are more than double the size of a bodymovin JSON and are rendered at a fixed size that can't be scaled up to match large and high density screens.
3. Png sequences. Png sequences are even worse than gifs in that their file sizes are often 30-50x the size of the bodymovin json and also can't be scaled up.

## Why is it called Lottie?
Lottie is named after a German film director and the foremost pioneer of silhouette animation. Her best known films are The Adventures of Prince Achmed (1926) – the oldest surviving feature-length animated film, preceding Walt Disney's feature-length Snow White and the Seven Dwarfs (1937) by over ten years
[The art of Lotte Reineger](https://www.youtube.com/watch?v=LvU55CUw5Ck&feature=youtu.be)

## Contributing
Contributors are more than welcome. Just upload a PR with a description of your changes.

If you would like to add more JSON files feel free to do so!

## Issues or feature requests?
File github issues for anything that is unexpectedly broken. If an After Effects file is not working, please attach it to your issue. Debugging without the original file is much more difficult. Lottie is developed and maintained by [Brandon Withrow](mailto:brandon.withrow@airbnb.com). Feel free to reach out via email or [Twitter](https://twitter.com/theWithra)

## Roadmap (In no particular order)
- Add support for interactive animated transitions
