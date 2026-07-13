import { useRouter } from 'next/router';

import EasCliLocal from './instructions/eas-cli-local.mdx';
import Eas from './instructions/eas.mdx';
import ExpoGoToDevBuild from './instructions/expo-go-to-dev-build.mdx';

export function DevelopmentBuildInstructions() {
  const router = useRouter();
  const { query } = router;

  if (query.buildenv === 'eas-cli-local') {
    return <EasCliLocal />;
  }

  if (query.buildenv === 'expo-go-to-dev-build') {
    return <ExpoGoToDevBuild />;
  }

  return <Eas />;
}
