import {
  Children,
  ComponentType,
  Fragment,
  PropsWithChildren,
  ReactElement,
  ReactNode,
  createContext,
  isValidElement,
  useContext,
  useMemo,
} from 'react';

import * as Checkout from '~/scenes/eas-functions/_checkout.mdx';
import * as DownloadArtifact from '~/scenes/eas-functions/_downloadArtifact.mdx';
import * as DownloadBuild from '~/scenes/eas-functions/_downloadBuild.mdx';
import * as InstallNodeModules from '~/scenes/eas-functions/_installNodeModules.mdx';
import * as PosthogAnnotation from '~/scenes/eas-functions/_posthogAnnotation.mdx';
import * as PosthogCaptureEvent from '~/scenes/eas-functions/_posthogCaptureEvent.mdx';
import * as PosthogFlagRollout from '~/scenes/eas-functions/_posthogFlagRollout.mdx';
import * as PosthogUploadSourcemaps from '~/scenes/eas-functions/_posthogUploadSourcemaps.mdx';
import * as PosthogWaitForMetric from '~/scenes/eas-functions/_posthogWaitForMetric.mdx';
import * as PosthogWaitForQuery from '~/scenes/eas-functions/_posthogWaitForQuery.mdx';
import * as Prebuild from '~/scenes/eas-functions/_prebuild.mdx';
import * as RestoreCache from '~/scenes/eas-functions/_restoreCache.mdx';
import * as SaveCache from '~/scenes/eas-functions/_saveCache.mdx';
import * as SendSlackMessage from '~/scenes/eas-functions/_sendSlackMessage.mdx';
import * as UploadArtifact from '~/scenes/eas-functions/_uploadArtifact.mdx';
import * as UseNpmToken from '~/scenes/eas-functions/_useNpmToken.mdx';
import { Tab, Tabs } from '~/ui/components/Tabs';

interface EASFunctionModule {
  default: ComponentType;
  modes?: readonly string[];
}

const FUNCTIONS: Record<string, EASFunctionModule> = {
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

const ExampleModeContext = createContext<string | undefined>(undefined);

export function EASFunctionDescription({
  name,
  exampleMode,
}: {
  name: EASFunctionName;
  exampleMode?: string;
}) {
  const fn = FUNCTIONS[name];
  if (!fn) {
    throw new Error(
      `Unknown EAS function "${String(name)}". Valid names: ${Object.keys(FUNCTIONS).join(', ')}`
    );
  }
  const Content = fn.default;
  return (
    <ExampleModeContext.Provider value={exampleMode}>
      <Content />
    </ExampleModeContext.Provider>
  );
}

type TabChild = ReactElement<{ label?: string; children?: ReactNode }>;

const collectTabChildren = (nodes: ReactNode): TabChild[] => {
  const panels: TabChild[] = [];
  Children.forEach(nodes, child => {
    if (!isValidElement<{ children?: ReactNode }>(child)) {
      return;
    }
    if (child.type === Fragment) {
      panels.push(...collectTabChildren(child.props.children));
      return;
    }
    if (child.type === Tab) {
      panels.push(child as TabChild);
    }
  });
  return panels;
};

export function EASFunctionExampleTabs({ children }: PropsWithChildren) {
  const exampleMode = useContext(ExampleModeContext);
  const tabs = useMemo(() => collectTabChildren(children), [children]);

  if (exampleMode) {
    const match = tabs.find(tab => tab.props.label === exampleMode);
    if (match) {
      return <>{match.props.children}</>;
    }
    return null;
  }

  return <Tabs>{children}</Tabs>;
}
