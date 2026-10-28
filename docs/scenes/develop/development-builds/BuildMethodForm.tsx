import { PlanEnterpriseIcon } from '@expo/styleguide-icons/custom/PlanEnterpriseIcon';
import { TerminalSquareIcon } from '@expo/styleguide-icons/outline/TerminalSquareIcon';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { EasCliLogo } from './EasCliLogo';
import { MethodSelectCard } from './MethodSelectCard';

type BuildMethod = 'build-locally' | 'build-with-expo-services' | 'eas-cli-local';

const RENAMED_BUILD_METHODS: Partial<Record<string, BuildMethod>> = {
  'build-with-eas': 'build-with-expo-services',
};

export function BuildMethodForm() {
  const router = useRouter();
  const { query, isReady } = router;
  const [method, setMethod] = useState<BuildMethod | null>(null);

  useEffect(
    function queryDidUpdate() {
      if (isReady) {
        const renamedMethod =
          typeof query.buildenv === 'string' ? RENAMED_BUILD_METHODS[query.buildenv] : undefined;
        if (renamedMethod) {
          void router.replace(
            { query: { ...query, buildenv: renamedMethod }, hash: window.location.hash },
            undefined,
            { shallow: true, scroll: false }
          );
          return;
        }
        if (query.buildenv === 'build-with-expo-services' || query.buildenv === 'eas-cli-local') {
          setMethod(query.buildenv);
        } else {
          setMethod('build-locally');
        }
      }
    },
    [query.buildenv, isReady]
  );

  function onRadioChange(method: BuildMethod) {
    setMethod(method);

    const newQuery = { ...query };
    if (method === 'build-locally') {
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
        Icon={TerminalSquareIcon}
        title="Build locally"
        description="Compile with Android Studio and Xcode using Expo CLI. No Expo account needed."
        isSelected={method === 'build-locally'}
        onClick={() => {
          onRadioChange('build-locally');
        }}
      />
      <MethodSelectCard
        Icon={PlanEnterpriseIcon}
        title="Build in the cloud with Expo Build"
        description="Compile in the cloud on Expo servers. No native build tools needed and you can also create iOS builds from any operating system."
        isSelected={method === 'build-with-expo-services'}
        onClick={() => {
          onRadioChange('build-with-expo-services');
        }}
      />
      <MethodSelectCard
        Icon={EasCliLogo}
        title="Build locally with EAS CLI"
        description='Run the same Expo Build on your own machine with the "--local" flag. Expo Build still manages signing and profiles.'
        isSelected={method === 'eas-cli-local'}
        onClick={() => {
          onRadioChange('eas-cli-local');
        }}
      />
    </div>
  );
}
