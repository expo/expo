'use strict';

var TextInputState = require('../Components/TextInput/TextInputState');
function dismissKeyboard() {
  TextInputState.blurTextInput(TextInputState.currentlyFocusedInput());
}
module.exports = dismissKeyboard;