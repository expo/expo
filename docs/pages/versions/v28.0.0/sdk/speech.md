---
title: Speech
---

This module allows using Text-to-speech utility.

### `Expo.Speech.speak(text, options)`

Speak out loud the `text` given `options`. Calling this when another text is being spoken adds an utterance to queue.

#### Arguments

-   **text (_string_)** -- The text to be spoken.
-   **options (_object_)** --

      A map of options:

    -   **language (_string_)** -- The code of a language that should be used to read the `text`, check out IETF BCP 47 to see valid codes.
    -   **pitch (_number_)** -- Pitch of the voice to speak `text`. 1.0 is the normal pitch.
    -   **rate (_number_)** -- Rate of the voice to speak `text`. 1.0 is the normal rate.
    -   **onStart (_function_)** -- A callback that is invoked when speaking starts.
    -   **onDone (_function_)** -- A callback that is invoked when speaking finishes.
    -   **onStopped (_function_)** -- A callback that is invoked when speaking is stopped by calling `Expo.Speech.stop()`.
    -   **onError (_function_)** -- (Android only). A callback that is invoked when an error occurred while speaking.

### `Expo.Speech.stop()`

Interrupts current speech and deletes all in queue.

### `Expo.Speech.pause()`

Pauses current speech.

### `Expo.Speech.resume()`

Resumes speaking previously paused speech or does nothing if there's none.

### `Expo.Speech.isSpeakingAsync()`

Determine whether the Text-to-speech utility is currently speaking. Will return `true` if speaker is paused.

#### Returns

Returns a Promise that resolves to a boolean, `true` if speaking, `false` if not.
