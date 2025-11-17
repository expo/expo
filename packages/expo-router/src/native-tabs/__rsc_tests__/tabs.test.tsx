/// <reference types="jest-expo/rsc/expect" />
import * as React from 'react';

// Right now NativeTabs.Trigger.* components cannot be used in the server environment
import { Badge, Icon, Label } from '../../primitives';
import { NativeTabs } from '../NativeTabs';

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
