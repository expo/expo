import { useRouter } from 'next/router';

import Eas from './instructions/eas.mdx';
import EasLocal from './instructions/easLocal.mdx';
import Local from './instructions/local.mdx';

export function DevelopmentBuildInstructions() {
  const router = useRouter();
  const { query } = router;

  if (query.buildEnv === 'eas-local') {
    return <EasLocal />;
  }

  if (query.buildEnv === 'local') {
    return <Local />;
  }

  return <Eas />;
}
