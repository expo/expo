import { ComponentType } from 'react';

import Checkout from '~/scenes/eas-functions/_checkout.mdx';
import DownloadArtifact from '~/scenes/eas-functions/_downloadArtifact.mdx';
import DownloadBuild from '~/scenes/eas-functions/_downloadBuild.mdx';
import InstallNodeModules from '~/scenes/eas-functions/_installNodeModules.mdx';
import PosthogAnnotation from '~/scenes/eas-functions/_posthogAnnotation.mdx';
import PosthogCaptureEvent from '~/scenes/eas-functions/_posthogCaptureEvent.mdx';
import PosthogFlagRollout from '~/scenes/eas-functions/_posthogFlagRollout.mdx';
import PosthogUploadSourcemaps from '~/scenes/eas-functions/_posthogUploadSourcemaps.mdx';
import PosthogWaitForMetric from '~/scenes/eas-functions/_posthogWaitForMetric.mdx';
import PosthogWaitForQuery from '~/scenes/eas-functions/_posthogWaitForQuery.mdx';
import Prebuild from '~/scenes/eas-functions/_prebuild.mdx';
import RestoreCache from '~/scenes/eas-functions/_restoreCache.mdx';
import SaveCache from '~/scenes/eas-functions/_saveCache.mdx';
import SendSlackMessage from '~/scenes/eas-functions/_sendSlackMessage.mdx';
import UploadArtifact from '~/scenes/eas-functions/_uploadArtifact.mdx';
import UseNpmToken from '~/scenes/eas-functions/_useNpmToken.mdx';

const FUNCTIONS: Record<string, ComponentType> = {
  checkout: Checkout,
  download_artifact: DownloadArtifact,
  download_build: DownloadBuild,
  install_node_modules: InstallNodeModules,
  posthog_annotation: PosthogAnnotation,
  posthog_capture_event: PosthogCaptureEvent,
  posthog_flag_rollout: PosthogFlagRollout,
  posthog_upload_sourcemaps: PosthogUploadSourcemaps,
  posthog_wait_for_metric: PosthogWaitForMetric,
  posthog_wait_for_query: PosthogWaitForQuery,
  prebuild: Prebuild,
  restore_cache: RestoreCache,
  save_cache: SaveCache,
  send_slack_message: SendSlackMessage,
  upload_artifact: UploadArtifact,
  use_npm_token: UseNpmToken,
};

type EASFunctionName = keyof typeof FUNCTIONS;

export function EASFunctionDescription({ name }: { name: EASFunctionName }) {
  const Content = FUNCTIONS[name];
  if (!Content) {
    throw new Error(
      `Unknown EAS function "${String(name)}". Valid names: ${Object.keys(FUNCTIONS).join(', ')}`
    );
  }
  return <Content />;
}
