import AppIntents
internal import ExpoAppIntents

/// Lets JavaScript donate the counter intent with `donateIntentAsync('increaseCounter')` after the
/// user increases the counter in the app, so the system can suggest it. The intent takes no params,
/// so conforming to `DonatableAppIntent` is all it needs.
extension IncreaseCounterIntent: DonatableAppIntent {}
