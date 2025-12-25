import { mergeClasses } from '@expo/styleguide';
import { ArrowUpRightIcon } from '@expo/styleguide-icons/outline/ArrowUpRightIcon';
import { TerminalSquareIcon } from '@expo/styleguide-icons/outline/TerminalSquareIcon';
import { Language, Prism } from 'prism-react-renderer';
import { useEffect, useMemo, useState } from 'react';

import { CODE } from '~/ui/components/Text';
import { useIsMobileView } from '~/ui/components/utils/isMobileView';

import { Select } from '../../Select';
import { Snippet } from '../Snippet';
import { SnippetAction } from '../SnippetAction';
import { SnippetContent } from '../SnippetContent';
import { SnippetHeader } from '../SnippetHeader';
import { CopyAction } from '../actions/CopyAction';

type PackageManagerKey = 'npm' | 'yarn' | 'pnpm' | 'bun';
type PackageManagerCommandSet = Partial<Record<PackageManagerKey, string[]>>;

type TerminalProps = {
  cmd: string[];
  cmdCopy?: string;
  hideOverflow?: boolean;
  title?: string;
  className?: string;
  browserAction?: {
    href: string;
    label: string;
  };
  packageManagers?: PackageManagerCommandSet;
};

type CopyButtonProps = Pick<TerminalProps, 'cmd' | 'cmdCopy'>;

type BrowserActionProps = NonNullable<TerminalProps['browserAction']>;

type PackageTabsProps = {
  managers: PackageManagerKey[];
  activeManager: PackageManagerKey | null;
  onSelect: (manager: PackageManagerKey) => void;
  className?: string;
};

type PackageManagerState = {
  availableManagers: PackageManagerKey[];
  activeManager: PackageManagerKey | null;
  activeCmd: string[];
  shouldShowPackageTabs: boolean;
  setActiveManager: (manager: PackageManagerKey) => void;
};

const STORAGE_KEY = 'expo-docs-terminal-package-manager';

const PACKAGE_MANAGER_ORDER: PackageManagerKey[] = ['npm', 'yarn', 'pnpm', 'bun'];
const PACKAGE_MANAGER_LABELS: Record<PackageManagerKey, string> = {
  npm: 'npm',
  yarn: 'Yarn',
  pnpm: 'pnpm',
  bun: 'Bun',
};

export const Terminal = ({
  cmd,
  cmdCopy,
  hideOverflow,
  className,
  title = 'Terminal',
  browserAction,
  packageManagers,
}: TerminalProps) => {
  const { availableManagers, activeManager, activeCmd, shouldShowPackageTabs, setActiveManager } =
    usePackageManagerState(packageManagers, cmd);
  const isMobileView = useIsMobileView();

  return (
    <Snippet className={mergeClasses('terminal-snippet [li_&]:mt-4', className)}>
      <SnippetHeader alwaysDark title={title} Icon={TerminalSquareIcon}>
        <div className="flex items-center gap-2">
          {shouldShowPackageTabs &&
            (isMobileView ? (
              <PackageSelect
                managers={availableManagers}
                activeManager={activeManager}
                onSelect={setActiveManager}
              />
            ) : (
              <PackageTabs
                managers={availableManagers}
                activeManager={activeManager}
                onSelect={setActiveManager}
              />
            ))}
          {browserAction && <BrowserAction {...browserAction} />}
          <CopyButton cmd={activeCmd} cmdCopy={cmdCopy} />
        </div>
      </SnippetHeader>
      <SnippetContent alwaysDark hideOverflow={hideOverflow} className="flex flex-col">
        {activeCmd.map(cmdMapper)}
      </SnippetContent>
    </Snippet>
  );
};

/**
 * This method attempts to naively generate the basic cmdCopy from the given cmd list.
 * Currently, the implementation is simple, but we can add multiline support in the future.
 */
function getDefaultCmdCopy(cmd: TerminalProps['cmd']) {
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

  const [activeManager, setActiveManager] = useState<PackageManagerKey | null>(() => {
    if (typeof window === 'undefined') {
      return availableManagers[0] ?? null;
    }
    const stored = window.localStorage.getItem(STORAGE_KEY) as PackageManagerKey | null;
    if (stored && availableManagers.includes(stored)) {
      return stored;
    }
    return availableManagers[0] ?? null;
  });

  useEffect(() => {
    const shouldReset = !activeManager || !availableManagers.includes(activeManager);
    setActiveManager(
      availableManagers.length > 0 ? (shouldReset ? availableManagers[0] : activeManager) : null
    );
  }, [activeManager, availableManagers]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    if (activeManager) {
      window.localStorage.setItem(STORAGE_KEY, activeManager);
    }
  }, [activeManager]);

  const shouldShowPackageTabs = availableManagers.length > 0;
  const activeCmd = useMemo(() => {
    if (shouldShowPackageTabs && activeManager && packageManagers?.[activeManager]) {
      return packageManagers[activeManager] ?? fallbackCmd;
    }
    return fallbackCmd;
  }, [activeManager, fallbackCmd, packageManagers, shouldShowPackageTabs]);

  return { availableManagers, activeManager, activeCmd, shouldShowPackageTabs, setActiveManager };
}

/**
 *
 * @param managers - The available package managers.
 * @param activeManager - The currently active package manager.
 * @param onSelect - The function to call when a package manager is selected.
 * @returns
 */
const PackageTabs = ({ managers, activeManager, onSelect, className }: PackageTabsProps) => (
  <div
    role="tablist"
    aria-label="Package managers"
    className={mergeClasses('flex items-center gap-1 whitespace-nowrap', className)}>
    {managers.map(manager => {
      const isActive = manager === activeManager;
      return (
        <button
          key={manager}
          type="button"
          role="tab"
          aria-selected={isActive}
          className={mergeClasses(
            'rounded-md px-2 py-1 text-xs font-semibold transition-colors',
            isActive
              ? 'bg-palette-gray6 text-palette-white'
              : 'text-palette-gray9 hover:text-palette-white focus-visible:text-palette-white'
          )}
          onClick={() => {
            onSelect(manager);
          }}>
          {PACKAGE_MANAGER_LABELS[manager]}
        </button>
      );
    })}
  </div>
);

const PackageSelect = ({ managers, activeManager, onSelect, className }: PackageTabsProps) => (
  <Select
    className={mergeClasses(
      '!h-6 !min-h-[16px] min-w-[76px] !gap-1 !px-2 !py-0 text-xs [&_svg]:!h-3 [&_svg]:!w-3',
      className
    )}
    ariaLabel="Select package manager"
    value={activeManager ?? managers[0]}
    onValueChange={onSelect as (value: string) => void}
    options={managers.map(manager => ({
      id: manager,
      label: PACKAGE_MANAGER_LABELS[manager],
    }))}
    size="md"
  />
);

const BrowserAction = ({ href, label }: BrowserActionProps) => (
  <SnippetAction
    alwaysDark
    className="max-sm-gutters:gap-0 [&_p]:max-sm-gutters:hidden"
    rightSlot={<ArrowUpRightIcon className="icon-sm shrink-0 text-icon-secondary" />}
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
    return <br key={key} className="select-none" />;
  }

  if (line.startsWith('#')) {
    return (
      <CODE
        key={key}
        className="select-none whitespace-pre !border-none !bg-transparent !text-palette-gray10">
        {line}
      </CODE>
    );
  }

  if (line.startsWith('$')) {
    return (
      <div key={key} className="w-fit">
        <CODE className="select-none whitespace-pre !border-none !bg-transparent !text-secondary">
          -&nbsp;
        </CODE>
        <CODE
          className="whitespace-pre !border-none !bg-transparent text-default"
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
    <CODE key={key} className="whitespace-pre !border-none !bg-transparent text-default">
      {line}
    </CODE>
  );
}
