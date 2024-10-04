import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

import { Switch } from '~/ui/components/Switch';
import { CALLOUT, HEADLINE } from '~/ui/components/Text';

export function BuildEnvironmentSwitch() {
  const router = useRouter();
  const { query, isReady } = router;
  const [buildEnv, setBuildEnv] = useState<'local' | null>(null);

  useEffect(
    function queryDidUpdate() {
      if (isReady) {
        if (query.buildEnv) {
          setBuildEnv(query.buildEnv as 'local');
        }
      }
    },
    [query.buildEnv, isReady]
  );

  function onSwitchChange(isOn: boolean) {
    if (isOn) {
      setBuildEnv(null);

      const _query = query;
      delete _query.buildEnv;
      router.push(
        {
          query: _query,
        },
        undefined,
        { shallow: true }
      );
    } else {
      setBuildEnv('local');

      router.push(
        {
          query: {
            ...query,
            buildEnv: 'local',
          },
        },
        undefined,
        { shallow: true }
      );
    }
  }

  return (
    <div className="flex gap-3 items-start px-4 py-3 bg-subtle border border-default rounded-lg">
      <div className="mt-1">
        <Switch onChange={onSwitchChange} value={!buildEnv} />{' '}
      </div>
      <div>
        <HEADLINE>Build with Expo Application Services (EAS)</HEADLINE>
        <CALLOUT theme="secondary">
          {' '}
          EAS compiles your app in the cloud and produces a build that you can install on your
          device. Alternatively, you can compile your app on your own computer.
        </CALLOUT>
      </div>
    </div>
  );
}
