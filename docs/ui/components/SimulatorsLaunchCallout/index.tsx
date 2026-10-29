import { Smartphone02Icon } from '@expo/styleguide-icons/custom/Smartphone02Icon';
import { useEffect, useState } from 'react';

import { BoxLink } from '~/ui/components/BoxLink';

const SIMULATORS_LAUNCH_AT = new Date('2026-11-05T18:00:00Z');

export function SimulatorsLaunchCallout() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(function didMount() {
    setIsLoaded(true);
  }, []);

  if (!isLoaded || new Date() < SIMULATORS_LAUNCH_AT) {
    return null;
  }

  return (
    <BoxLink
      title="New: Expo Simulators"
      description="Cloud Android and iOS simulators for you and your agents. Run your builds without a local simulator."
      href="/preview/simulators/get-started/"
      Icon={Smartphone02Icon}
    />
  );
}
