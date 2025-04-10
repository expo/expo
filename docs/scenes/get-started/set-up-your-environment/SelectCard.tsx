import { ButtonBase, mergeClasses, useTheme } from '@expo/styleguide';

import { CALLOUT, HEADLINE } from '~/ui/components/Text';

type Props = {
  imgSrc: string;
  darkImgSrc?: string;
  alt: string;
  title: string;
  description?: string;
  isSelected: boolean;
  onClick: () => void;
};

export function SelectCard({
  imgSrc,
  darkImgSrc,
  alt,
  title,
  description,
  isSelected,
  onClick,
}: Props) {
  const { themeName } = useTheme();
  const isDarkMode = themeName === 'dark';

  return (
    <ButtonBase onClick={onClick}>
      <div
        className={mergeClasses(
          'flex w-[250px] flex-col overflow-hidden rounded-lg border border-default shadow-xs transition-all',
          'hocus:scale-[102%] hocus:shadow-sm'
        )}>
        <div
          className={mergeClasses(
            'border-b border-default',
            isSelected ? 'bg-gradient-to-b from-palette-blue3 to-palette-blue4' : 'bg-subtle'
          )}>
          <picture className="relative flex h-full w-auto items-end">
            {isDarkMode && <source srcSet={darkImgSrc} type="image/png" />}
            <img
              src={imgSrc}
              alt={alt}
              className={mergeClasses(isSelected ? 'grayscale-0' : 'opacity-80 grayscale')}
            />
          </picture>
        </div>
        <div className="flex flex-col gap-2 p-4">
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
                  'absolute right-1 top-1 size-3 rounded-full',
                  isSelected ? 'border-palette-blue9 bg-palette-blue9' : 'bg-transparent'
                )}
              />
            </div>
            <HEADLINE>{title}</HEADLINE>
          </div>
          {description ? (
            <CALLOUT theme="secondary" className="text-left">
              {description}
            </CALLOUT>
          ) : null}
        </div>
      </div>
    </ButtonBase>
  );
}
