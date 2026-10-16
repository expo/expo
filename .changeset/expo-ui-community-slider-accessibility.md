---
'@expo/ui': patch
---

Add `accessibilityLabel`, `accessibilityHint` (iOS) and `testID` to the community `Slider`. The drop-in dropped them, so VoiceOver and TalkBack announced a slider by its value alone and end-to-end tools could not find it. iOS applies them as SwiftUI accessibility modifiers, Android as the `semantics` and `testID` modifiers, and web as `aria-label` and `data-testid`.
