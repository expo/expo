import { mergeClasses } from '@expo/styleguide';
import { TerminalSquareDuotoneIcon } from '@expo/styleguide-icons/duotone/TerminalSquareDuotoneIcon';

import { Tag } from '~/ui/components/Tag/Tag';

type Props = {
  cliVersion: string;
  className?: string;
};

export function PageCliVersion({ cliVersion, className }: Props) {
  if (!cliVersion) {
    return null;
  }

  return (
    <div className={mergeClasses('flex items-center gap-2', className)}>
      <div
        className="flex items-center justify-center gap-1.5 text-xs text-secondary"
        aria-hidden="true">
        <TerminalSquareDuotoneIcon className="icon-sm text-icon-secondary" />
        CLI version:
        <Tag name={cliVersion} className="select-auto" />
        <span className="sr-only">{`CLI version ${cliVersion}`}</span>
      </div>
    </div>
  );
}
