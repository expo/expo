import { useEffect, useMemo, useState } from 'react';

import { AgentPrompt } from '~/ui/components/AgentPrompt';

import { buildNativeUpgradePrompt } from './buildUpgradePrompt';

type NativeUpgradePromptCalloutProps = {
  fromVersion: string;
  toVersion: string;
  diff?: string;
};

export function NativeUpgradePromptCallout({
  fromVersion,
  toVersion,
  diff,
}: NativeUpgradePromptCalloutProps) {
  const [isMounted, setIsMounted] = useState(false);

  // The prompt carries the page URL and the whole diff, so it is built after mount: the server has
  // no origin to pin the URL to, and the diff already ships once in the diff blocks below.
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const prompt = useMemo(() => {
    if (!isMounted || !diff) {
      return '';
    }

    const url = `${window.location.origin}${window.location.pathname}?fromSdk=${fromVersion}&toSdk=${toVersion}`;

    return buildNativeUpgradePrompt({ from: fromVersion, to: toVersion, diff, url });
  }, [isMounted, fromVersion, toVersion, diff]);

  if (!diff) {
    return null;
  }

  return (
    <div data-md="skip">
      <AgentPrompt
        title="Upgrade your native project with an AI agent"
        description={`Paste this into Claude, Cursor, Codex, or another agent. It carries the full diff from SDK ${fromVersion} to SDK ${toVersion}.`}
        prompt={prompt}
      />
    </div>
  );
}
