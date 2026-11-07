---
'expo-hinge': patch
---

[iOS] Add a native `Hinge` registry (`Hinge.hinge`, `Hinge.addListener()`, `Hinge.removeListener()`) and make `HingeState` and `HingeStatus` public, so native code in other modules can read the hinge synchronously, such as an app delegate subscriber answering `supportedInterfaceOrientationsFor` from the hinge when UIKit asks.
