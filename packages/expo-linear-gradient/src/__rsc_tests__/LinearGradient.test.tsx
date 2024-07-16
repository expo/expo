/// <reference types="jest-expo/rsc/expect" />

import { LinearGradient } from '../LinearGradient';

it(`renders to RSC`, async () => {
  const jsx = (
    <LinearGradient
      colors={['cyan', '#ff00ff', 'rgba(0,0,0,0)', 'rgba(0,255,255,0.5)']}
      testID="gradient"
    />
  );

  await expect(jsx).toMatchFlight(`1:I["src/LinearGradient.tsx",[],"LinearGradient"]
0:["$","$L1",null,{"colors":["cyan","#ff00ff","rgba(0,0,0,0)","rgba(0,255,255,0.5)"],"testID":"gradient"},null]`);
});
