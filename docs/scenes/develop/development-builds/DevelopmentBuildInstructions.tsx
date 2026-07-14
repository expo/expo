import { useRouter } from 'next/router';

import BuildLocally from './instructions/build-locally.mdx';
import EasCliLocal from './instructions/eas-cli-local.mdx';
import Eas from './instructions/eas.mdx';

export function DevelopmentBuildInstructions() {
  const router = useRouter();
  const { query } = router;

  if (query.buildenv === 'build-with-eas') {
    return <Eas />;
  }

  if (query.buildenv === 'eas-cli-local') {
    return <EasCliLocal />;
  }

  return <BuildLocally />;
}
