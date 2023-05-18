import matchers from "expect/build/matchers";

require("react-native-reanimated/lib/reanimated2/jestUtils").setUpTests();

matchers.customTesters = [];

expect.extend({
  styleToEqual(received, style) {
    const receivedStyle = received.component.mock.lastCall[0].style;
    return matchers.toEqual(receivedStyle, style);
  },
});
