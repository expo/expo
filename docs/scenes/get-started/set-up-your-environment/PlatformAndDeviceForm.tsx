import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

import { SelectCard } from './SelectCard';

type Platform = 'android' | 'ios';
type Device = 'physical' | 'simulated';

export function PlatformAndDeviceForm() {
  const router = useRouter();
  const { query, isReady } = router;
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [device, setDevice] = useState<Device | null>(null);

  useEffect(
    function queryDidUpdate() {
      if (isReady) {
        if (query.platform) {
          setPlatform(query.platform as Platform);
        } else {
          setPlatform('android');
        }
        if (query.device) {
          setDevice(query.device as Device);
        } else {
          setDevice('physical');
        }
      }
    },
    [query.platform, query.device, isReady]
  );

  function onRadioChange(platform: Platform, device: Device) {
    setPlatform(platform);
    setDevice(device);

    void router.push(
      {
        query: {
          ...query,
          platform,
          device,
        },
      },
      undefined,
      { shallow: true }
    );
  }

  return (
    <div className="flex flex-wrap gap-4">
      <div className="flex flex-wrap gap-4">
        <SelectCard
          imgSrc="/static/images/get-started/android-device.webp"
          darkImgSrc="/static/images/get-started/android-device-dark.webp"
          title="Android device"
          alt="Android device"
          isSelected={platform === 'android' && device === 'physical'}
          onClick={() => {
            onRadioChange('android', 'physical');
          }}
        />
        <SelectCard
          imgSrc="/static/images/get-started/ios-device.webp"
          darkImgSrc="/static/images/get-started/ios-device-dark.webp"
          title="iOS device"
          alt="iOS device"
          isSelected={platform === 'ios' && device === 'physical'}
          onClick={() => {
            onRadioChange('ios', 'physical');
          }}
        />
      </div>
      <div className="flex flex-wrap gap-4">
        <SelectCard
          imgSrc="/static/images/get-started/android-emulator.webp"
          darkImgSrc="/static/images/get-started/android-emulator-dark.webp"
          title="Android Emulator"
          alt="Android Emulator"
          isSelected={platform === 'android' && device === 'simulated'}
          onClick={() => {
            onRadioChange('android', 'simulated');
          }}
        />
        <SelectCard
          imgSrc="/static/images/get-started/ios-simulator.webp"
          darkImgSrc="/static/images/get-started/ios-simulator-dark.webp"
          title="iOS Simulator"
          alt="iOS Simulator"
          isSelected={platform === 'ios' && device === 'simulated'}
          onClick={() => {
            onRadioChange('ios', 'simulated');
          }}
        />
      </div>
    </div>
  );
}
