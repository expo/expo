import { ButtonBase, mergeClasses } from '@expo/styleguide';
import type { ComponentType, HTMLAttributes } from 'react';

import { CALLOUT, HEADLINE } from '~/ui/components/Text';

type Props = {
  Icon: ComponentType<HTMLAttributes<SVGSVGElement>>;
  title: string;
  description: string;
  isSelected: boolean;
  onClick: () => void;
};

export function MethodSelectCard({ Icon, title, description, isSelected, onClick }: Props) {
  return (
    <ButtonBase onClick={onClick}>
      <div
        className={mergeClasses(
          'flex h-full w-62.5 flex-col overflow-hidden rounded-lg border border-default shadow-xs transition-all',
          'hocus:scale-[102%] hocus:shadow-sm'
        )}>
        <div
          className={mergeClasses(
            'flex items-center justify-center border-b border-default py-6',
            isSelected ? 'bg-linear-to-b from-palette-blue3 to-palette-blue4' : 'bg-subtle'
          )}>
          <Icon
            style={{ width: 56, height: 56 }}
            className={isSelected ? 'text-link' : 'text-icon-default'}
          />
        </div>
        <div className="flex grow flex-col gap-2 p-4">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div
                className={mergeClasses(
                  'size-5 rounded-full border bg-default',
                  isSelected ? 'border-palette-blue9' : 'border-default'
                )}
              />
              <div
                className={mergeClasses(
                  'absolute top-1 right-1 size-3 rounded-full',
                  isSelected ? 'border-palette-blue9 bg-palette-blue9' : 'bg-transparent'
                )}
              />
            </div>
            <HEADLINE className="text-left">{title}</HEADLINE>
          </div>
          <CALLOUT theme="secondary" className="text-left">
            {description}
          </CALLOUT>
        </div>
      </div>
    </ButtonBase>
  );
}
