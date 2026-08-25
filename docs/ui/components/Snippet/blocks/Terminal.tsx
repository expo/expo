import { mergeClasses } from '@expo/styleguide';
import { ArrowUpRightIcon } from '@expo/styleguide-icons/outline/ArrowUpRightIcon';
import { TerminalSquareIcon } from '@expo/styleguide-icons/outline/TerminalSquareIcon';
import { Language, Prism } from 'prism-react-renderer';
import { useMemo, useSyncExternalStore } from 'react';

import { CODE } from '~/ui/components/Text';

import { Select } from '../../Select';
import { Snippet } from '../Snippet';
import { SnippetAction } from '../SnippetAction';
import { SnippetContent } from '../SnippetContent';
import { SnippetHeader } from '../SnippetHeader';
import { CopyAction } from '../actions/CopyAction';
import {
  PACKAGE_MANAGER_ORDER,
  getPackageManagerServerSnapshot,
  getPackageManagerSnapshot,
  setPackageManagerPreference,
  subscribePackageManagerStore,
} from './packageManagerStore';
import type { PackageManagerKey } from './packageManagerStore';

export type PackageManagerCommandSet = Partial<Record<PackageManagerKey, string[]>>;

type TerminalProps = {
  cmd: string[] | PackageManagerCommandSet;
  cmdCopy?: string;
  hideOverflow?: boolean;
  title?: string;
  className?: string;
  browserAction?: {
    href: string;
    label: string;
  };
};

type CopyButtonProps = {
  cmd: string[];
  cmdCopy?: string;
};

type BrowserActionProps = NonNullable<TerminalProps['browserAction']>;

type PackageSelectorProps = {
  managers: PackageManagerKey[];
  activeManager: PackageManagerKey | null;
  onSelect: (manager: PackageManagerKey) => void;
  className?: string;
};

type PackageTokens = Map<PackageManagerKey, string>;

type PackageTabsProps = PackageSelectorProps & {
  tokens: PackageTokens;
};

type PackageManagerState = {
  availableManagers: PackageManagerKey[];
  activeManager: PackageManagerKey | null;
  activeCmd: string[];
  preferenceTokens: PackageTokens;
  shouldShowPackageTabs: boolean;
  setActiveManager: (manager: PackageManagerKey) => void;
};

export const Terminal = ({
  cmd,
  cmdCopy,
  hideOverflow,
  className,
  title = 'Terminal',
  browserAction,
}: TerminalProps) => {
  const [fallbackCmd, packageManagers] = Array.isArray(cmd) ? [cmd, undefined] : [[], cmd];
  const {
    availableManagers,
    activeManager,
    activeCmd,
    preferenceTokens,
    shouldShowPackageTabs,
    setActiveManager,
  } = usePackageManagerState(packageManagers, fallbackCmd);
  const packageManagerSlot = shouldShowPackageTabs ? (
    <>
      <PackageSelect
        managers={availableManagers}
        activeManager={activeManager}
        onSelect={setActiveManager}
        className="ml-4 min-[641px]:hidden"
      />
      <PackageTabs
        managers={availableManagers}
        activeManager={activeManager}
        tokens={preferenceTokens}
        onSelect={setActiveManager}
        className="ml-6 max-[640px]:hidden"
      />
    </>
  ) : null;

  return (
    <Snippet
      data-md="terminal"
      data-md-commands={packageManagers ? JSON.stringify(packageManagers) : undefined}
      className={mergeClasses('terminal-snippet [li_&]:mt-4', className)}>
      <SnippetHeader
        alwaysDark
        title={title}
        titleSlot={packageManagerSlot}
        Icon={TerminalSquareIcon}>
        <div className="flex items-center gap-2">
          {browserAction && <BrowserAction {...browserAction} />}
          <CopyButton cmd={activeCmd} cmdCopy={cmdCopy} />
        </div>
      </SnippetHeader>
      <SnippetContent alwaysDark hideOverflow={hideOverflow} className="flex flex-col">
        {shouldShowPackageTabs
          ? availableManagers.map(manager => (
              <div key={manager} data-pm-block={preferenceTokens.get(manager)}>
                {(packageManagers?.[manager] ?? fallbackCmd).map(cmdMapper)}
              </div>
            ))
          : activeCmd.map(cmdMapper)}
      </SnippetContent>
    </Snippet>
  );
};

/**
 * This method attempts to naively generate the basic cmdCopy from the given cmd list.
 * Currently, the implementation is simple, but we can add multiline support in the future.
 */
function getDefaultCmdCopy(cmd: string[]) {
  const validLines = cmd.filter(line => !line.startsWith('#') && line !== '');
  if (validLines.length === 1) {
    return validLines[0].startsWith('$') ? validLines[0].slice(2) : validLines[0];
  }
  return undefined;
}

const CopyButton = ({ cmd, cmdCopy }: CopyButtonProps) => {
  const copyText = cmdCopy ?? getDefaultCmdCopy(cmd);

  if (!copyText) {
    return null;
  }

  return <CopyAction alwaysDark text={copyText} />;
};

function resolvePreferenceTokens(available: PackageManagerKey[]): PackageTokens {
  const fallback = available[0];
  const tokens = new Map(available.map(manager => [manager, [manager] as string[]]));
  PACKAGE_MANAGER_ORDER.filter(manager => !tokens.has(manager)).forEach(manager => {
    tokens.get(fallback)?.push(manager);
  });
  return new Map([...tokens].map(([manager, keys]) => [manager, keys.join(' ')]));
}

/**
 * Manages the state for the package manager tabs.
 */
function usePackageManagerState(
  packageManagers: PackageManagerCommandSet | undefined,
  fallbackCmd: string[]
): PackageManagerState {
  const availableManagers = useMemo(
    () => PACKAGE_MANAGER_ORDER.filter(manager => packageManagers?.[manager]?.length),
    [packageManagers]
  );
  const preferenceTokens = useMemo(
    () => resolvePreferenceTokens(availableManagers),
    [availableManagers]
  );

  const preferredManager = useSyncExternalStore(
    subscribePackageManagerStore,
    getPackageManagerSnapshot,
    getPackageManagerServerSnapshot
  );

  const activeManager = useMemo(() => {
    if (preferredManager && availableManagers.includes(preferredManager)) {
      return preferredManager;
    }
    return availableManagers[0] ?? null;
  }, [availableManagers, preferredManager]);

  const shouldShowPackageTabs = availableManagers.length > 0;
  const activeCmd = useMemo(() => {
    if (shouldShowPackageTabs && activeManager && packageManagers?.[activeManager]) {
      return packageManagers[activeManager] ?? fallbackCmd;
    }
    return fallbackCmd;
  }, [activeManager, fallbackCmd, packageManagers, shouldShowPackageTabs]);

  const setActiveManager = (manager: PackageManagerKey) => {
    if (!availableManagers.includes(manager)) {
      return;
    }
    setPackageManagerPreference(manager);
  };

  return {
    availableManagers,
    activeManager,
    activeCmd,
    preferenceTokens,
    shouldShowPackageTabs,
    setActiveManager,
  };
}

/**
 * Which tab looks selected comes from CSS, keyed on `data-pm-tab`, so the right one
 * is highlighted on the first frame. `aria-selected` still comes from React, which
 * settles it at hydration.
 *
 * @param managers - The available package managers.
 * @param activeManager - The currently active package manager.
 * @param tokens - The saved preferences each manager answers to.
 * @param onSelect - The function to call when a package manager is selected.
 */
const PackageTabs = ({
  managers,
  activeManager,
  tokens,
  onSelect,
  className,
}: PackageTabsProps) => (
  <span
    role="tablist"
    aria-label="Package managers"
    className={mergeClasses('inline-flex items-center gap-1 whitespace-nowrap', className)}>
    {managers.map(manager => (
      <button
        key={manager}
        type="button"
        role="tab"
        data-pm-tab={tokens.get(manager)}
        aria-selected={manager === activeManager}
        className="rounded-md px-2 py-1 text-sm font-semibold transition-colors"
        onClick={() => {
          onSelect(manager);
        }}>
        {manager}
      </button>
    ))}
  </span>
);

const PackageSelect = ({ managers, activeManager, onSelect, className }: PackageSelectorProps) => (
  <Select
    className={mergeClasses(
      'h-6! min-h-4! min-w-19 gap-1! px-2! py-0! text-sm [&_svg]:size-3!',
      className
    )}
    ariaLabel="Select package manager"
    value={activeManager ?? managers[0]}
    onValueChange={onSelect as (value: string) => void}
    options={managers.map(manager => ({
      id: manager,
      label: manager,
    }))}
    size="md"
  />
);

const BrowserAction = ({ href, label }: BrowserActionProps) => (
  <SnippetAction
    alwaysDark
    className="max-sm:gap-0 [&_p]:max-sm:hidden"
    rightSlot={
      <ArrowUpRightIcon aria-hidden="true" className="icon-sm shrink-0 text-icon-secondary" />
    }
    onClick={() => {
      if (typeof window !== 'undefined') {
        window.open(href, '_blank', 'noopener,noreferrer');
      }
    }}>
    {label}
  </SnippetAction>
);

/**
 * Map all provided lines and render the correct component.
 * This method supports:
 *   - Render newlines for empty strings
 *   - Render a line with `#` prefix as comment with secondary text
 *   - Render a line without `$` prefix as primary text
 *   - Render a line with `$` prefix, as secondary and primary text
 */
function cmdMapper(line: string, index: number) {
  const key = `line-${index}`;

  if (line.trim() === '') {
    return <br key={key} data-md="skip" className="select-none" />;
  }

  if (line.startsWith('#')) {
    return (
      <CODE
        key={key}
        data-md="skip"
        className="border-none! bg-transparent! whitespace-pre text-palette-gray10! select-none">
        {line}
      </CODE>
    );
  }

  if (line.startsWith('$')) {
    return (
      <div key={key} className="w-fit">
        <CODE
          data-md="skip"
          className="border-none! bg-transparent! whitespace-pre text-secondary! select-none">
          -&nbsp;
        </CODE>
        <CODE
          className="border-none! bg-transparent! whitespace-pre text-default"
          dangerouslySetInnerHTML={{
            __html: Prism.highlight(
              line.slice(1).trim(),
              Prism.languages['bash'],
              'bash' as Language
            ),
          }}
        />
      </div>
    );
  }

  return (
    <CODE key={key} className="border-none! bg-transparent! whitespace-pre text-default">
      {line}
    </CODE>
  );
}
