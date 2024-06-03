import { SafeAreaView, TouchableNativeFeedback, Switch, Pressable } from 'react-native';

Object.entries({ SafeAreaView, TouchableNativeFeedback, Switch, Pressable }).forEach(
  ([name, Component]) => {
    it(`renders ${name} to RSC`, async () => {
      const jsx = <Component />;

      await expect(jsx).toMatchFlightSnapshot();
    });
  }
);

// it(`renders SafeAreaView to RSC`, async () => {
//   const jsx = <SafeAreaView />;

//   await expect(jsx)
//     .toMatchFlight(`2:I[\"../../node_modules/react-native-web/dist/exports/View/index.js\",[],\"\"]
// 1:{\"name\":\"SafeAreaView\",\"env\":\"Server\",\"owner\":null}
// 0:D\"$1\"
// 0:[\"$\",\"$L2\",null,{\"ref\":\"$undefined\",\"style\":[{\"paddingTop\":\"env(safe-area-inset-top)\",\"paddingRight\":\"env(safe-area-inset-right)\",\"paddingBottom\":\"env(safe-area-inset-bottom)\",\"paddingLeft\":\"env(safe-area-inset-left)\"},\"$undefined\"]},\"$1\"]`);
// });

// it(`renders TouchableNativeFeedback to RSC`, async () => {
//   const jsx = <TouchableNativeFeedback />;

//   await expect(jsx).toMatchFlightSnapshot();
// });
