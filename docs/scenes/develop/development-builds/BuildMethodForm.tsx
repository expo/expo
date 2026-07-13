import { PlanEnterpriseIcon } from '@expo/styleguide-icons/custom/PlanEnterpriseIcon';
import { TerminalSquareIcon } from '@expo/styleguide-icons/outline/TerminalSquareIcon';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { EasCliLogo } from './EasCliLogo';
import { MethodSelectCard } from './MethodSelectCard';

type BuildMethod = 'eas' | 'eas-local' | 'local';

export function BuildMethodForm() {
  const router = useRouter();
  const { query, isReady } = router;
  const [method, setMethod] = useState<BuildMethod | null>(null);

  useEffect(
    function queryDidUpdate() {
      if (isReady) {
        if (query.buildEnv === 'eas-local' || query.buildEnv === 'local') {
          setMethod(query.buildEnv);
        } else {
          setMethod('eas');
        }
      }
    },
    [query.buildEnv, isReady]
  );

  function onRadioChange(method: BuildMethod) {
    setMethod(method);

    const newQuery = { ...query };
    if (method === 'eas') {
      delete newQuery.buildEnv;
    } else {
      newQuery.buildEnv = method;
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
        description='Run the same EAS build on your own machine with the "--local" flag. EAS still manages signing and profiles.'
        isSelected={method === 'eas-local'}
        onClick={() => {
          onRadioChange('eas-local');
        }}
      />
      <MethodSelectCard
        Icon={TerminalSquareIcon}
        title="Build locally without EAS"
        description="Compile with Android Studio and Xcode using Expo CLI. No Expo account needed."
        isSelected={method === 'local'}
        onClick={() => {
          onRadioChange('local');
        }}
      />
    </div>
  );
}
