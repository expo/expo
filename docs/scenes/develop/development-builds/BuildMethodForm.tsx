import { PlanEnterpriseIcon } from '@expo/styleguide-icons/custom/PlanEnterpriseIcon';
import { TerminalSquareIcon } from '@expo/styleguide-icons/outline/TerminalSquareIcon';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { EasCliLogo } from './EasCliLogo';
import { MethodSelectCard } from './MethodSelectCard';

type BuildMethod = 'eas' | 'eas-cli-local' | 'expo-go-to-dev-build';

export function BuildMethodForm() {
  const router = useRouter();
  const { query, isReady } = router;
  const [method, setMethod] = useState<BuildMethod | null>(null);

  useEffect(
    function queryDidUpdate() {
      if (isReady) {
        if (query.buildenv === 'eas-cli-local' || query.buildenv === 'expo-go-to-dev-build') {
          setMethod(query.buildenv);
        } else {
          setMethod('eas');
        }
      }
    },
    [query.buildenv, isReady]
  );

  function onRadioChange(method: BuildMethod) {
    setMethod(method);

    const newQuery = { ...query };
    if (method === 'eas') {
      delete newQuery.buildenv;
    } else {
      newQuery.buildenv = method;
    }

    void router.push(
      {
        query: newQuery,
      },
      undefined,
      { shallow: true }
    );
  }

  return (
    <div className="flex flex-wrap gap-4">
      <MethodSelectCard
        Icon={PlanEnterpriseIcon}
        title="Build with EAS"
        description="Compile in the cloud on EAS servers. No native build tools needed and you can also create iOS builds from any operating system."
        isSelected={method === 'eas'}
        onClick={() => {
          onRadioChange('eas');
        }}
      />
      <MethodSelectCard
        Icon={EasCliLogo}
        title="Build locally with EAS CLI"
        description='Run the same EAS Build on your own machine with the "--local" flag. EAS still manages signing and profiles.'
        isSelected={method === 'eas-cli-local'}
        onClick={() => {
          onRadioChange('eas-cli-local');
        }}
      />
      <MethodSelectCard
        Icon={TerminalSquareIcon}
        title="Switch from Expo Go"
        description="Compile with Android Studio and Xcode using Expo CLI. No Expo account needed."
        isSelected={method === 'expo-go-to-dev-build'}
        onClick={() => {
          onRadioChange('expo-go-to-dev-build');
        }}
      />
    </div>
  );
}
