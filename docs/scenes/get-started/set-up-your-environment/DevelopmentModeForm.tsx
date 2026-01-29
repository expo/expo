import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

import { SelectCard } from './SelectCard';

type DevelopmentMode = 'expo-go' | 'development-build';

export function DevelopmentModeForm() {
  const router = useRouter();
  const { query, isReady } = router;
  const [mode, setMode] = useState<DevelopmentMode | null>(null);

  useEffect(
    function queryDidUpdate() {
      if (isReady) {
        if (query.mode) {
          setMode(query.mode as DevelopmentMode);
        } else {
          setMode('expo-go');
        }
      }
    },
    [query.mode, isReady]
  );

  function onRadioChange(mode: DevelopmentMode) {
    setMode(mode);

    void router.push(
      {
        query: {
          ...query,
          mode,
        },
      },
      undefined,
      { shallow: true }
    );
  }

  return (
    <div className="flex flex-wrap gap-4">
      <SelectCard
        imgSrc="/static/images/get-started/expo-go.png"
        darkImgSrc="/static/images/get-started/expo-go-dark.png"
        title="Expo Go"
        alt="Expo Go"
        description="For students and learners to test out Expo quickly and understand the basics. It's a playground app, so it's limited and not useful for building production-grade projects."
        isSelected={mode === 'expo-go'}
        onClick={() => {
          onRadioChange('expo-go');
        }}
      />
      <SelectCard
        imgSrc="/static/images/get-started/development-build.png"
        darkImgSrc="/static/images/get-started/development-build-dark.png"
        title="Development build"
        alt="Development build"
        description="Make a build of your own app with developer tools. Supports custom native modules. Intended for production projects."
        isSelected={mode === 'development-build'}
        onClick={() => {
          onRadioChange('development-build');
        }}
      />
    </div>
  );
}
