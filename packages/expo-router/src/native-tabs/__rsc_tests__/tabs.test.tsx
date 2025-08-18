/// <reference types="jest-expo/rsc/expect" />
import * as React from 'react';

import { NativeTabs } from '../NativeBottomTabs/NativeTabs';
import { Badge, Icon, Label } from '../common/elements';

it(`renders NativeTabs`, async () => {
  await expect(<NativeTabs />).toMatchFlightSnapshot();
});

it(`renders NativeTabs.Trigger`, async () => {
  await expect(<NativeTabs.Trigger name="test" />).toMatchFlightSnapshot();
});

it(`renders Icon src`, async () => {
  await expect(<Icon src={require('../../../assets/sitemap.png')} />).toMatchFlightSnapshot();
});

it(`renders Icon sf`, async () => {
  await expect(<Icon sf="0.circle" />).toMatchFlightSnapshot();
});

it(`renders Icon drawable`, async () => {
  await expect(<Icon drawable="0.circle" />).toMatchFlightSnapshot();
});

it(`renders Badge`, async () => {
  await expect(<Badge>Test</Badge>).toMatchFlightSnapshot();
});

it(`renders Label`, async () => {
  await expect(<Label>Test</Label>).toMatchFlightSnapshot();
});
