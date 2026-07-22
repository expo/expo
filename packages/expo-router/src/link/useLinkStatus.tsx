'use client';
import { createContext, use, useCallback, useMemo, useState } from 'react';

import { NavigationTransitionPendingContext } from '../global-state/transitionPendingContext';

export type LinkStatus = {
  /**
   * `true` while the navigation this `Link` last initiated is in flight — from the press until its
   * destination is ready and committed. Because a `Link` press is a JS-initiated React transition, a
   * press toward a suspending destination (a lazy bundle-split screen, a `use(promise)`/suspending
   * loader) keeps the current screen up while it prepares, and this is `true` for that window.
   */
  pending: boolean;
};

const LinkStatusContext = createContext<LinkStatus>({ pending: false });

/**
 * Returns the status of the nearest parent [`Link`](#link) — currently `{ pending }`, which is `true`
 * while that `Link`'s last-initiated navigation is in flight. Use it to render a pending indicator
 * scoped to a single link (a Next.js `useLinkStatus`-style API) without wiring `useTransition`
 * yourself.
 *
 * Must be rendered inside a `Link`'s children. Returns `{ pending: false }` when there is no parent
 * `Link`; also stays `{ pending: false }` in two cases where the press does not dispatch an in-tree
 * navigation: DOM components (the press is forwarded to the host WebView) and a `Link` whose
 * navigation is committed by an iOS peek-and-pop preview (`Link.Preview` — the preview commit fires
 * from a native callback, not the tracked press).
 *
 * @example
 * ```tsx
 * import { Link, useLinkStatus } from 'expo-router';
 *
 * function PendingDot() {
 *   const { pending } = useLinkStatus();
 *   return pending ? <ActivityIndicator /> : null;
 * }
 *
 * <Link href="/slow"><PendingDot />Go</Link>
 * ```
 */
export function useLinkStatus(): LinkStatus {
  return use(LinkStatusContext);
}

// Wires a `Link`'s pending status without a per-Link `useTransition` (which the container's own
// `React.startTransition` re-wrap would defeat — PLAN D3 correction). On press, after the dispatch
// synchronously mints an id, the Link records that id; `pending` is then `myIssued > lastReduced`,
// read from the committed pending signal. Returns the provider and the press-capture callback the
// Link installs around its own `onPress`.
export function useLinkStatusProvider() {
  const { lastReduced, getLastIssued } = use(NavigationTransitionPendingContext);
  const [myIssued, setMyIssued] = useState(0);

  // Wrap a Link's press: snapshot the issued counter before the press, run it, and adopt the new id
  // ONLY if this press actually minted one (the counter strictly advanced). A press that doesn't
  // dispatch — an external / modifier / preview-blocked click, a pre-ready buffered call, a no-op —
  // leaves the counter unchanged, so this Link must not adopt another navigation's in-flight id (which
  // would show a spurious pending). Tracking only a strictly-newer id keeps `pending` scoped to this
  // Link's own navigation.
  const trackPress = useCallback(
    (press: () => void) => {
      const before = getLastIssued();
      press();
      const after = getLastIssued();
      if (after > before) {
        setMyIssued(after);
      }
    },
    [getLastIssued]
  );

  const value = useMemo<LinkStatus>(
    () => ({ pending: myIssued > lastReduced }),
    [myIssued, lastReduced]
  );

  const Provider = LinkStatusContext.Provider;

  return { trackPress, value, Provider };
}
