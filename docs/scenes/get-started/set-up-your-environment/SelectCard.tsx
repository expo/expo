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
          'w-[250px] shadow-xs overflow-hidden rounded-lg flex flex-col items-center border border-default transition-all',
          'hocus:scale-[102%] hocus:shadow-sm'
        )}>
        <div
          className={mergeClasses(
            'border-b border-default',
            isSelected ? 'bg-gradient-to-b from-palette-blue3 to-palette-blue4' : 'bg-subtle'
          )}>
          <picture className="relative w-auto h-full flex items-end">
            {isDarkMode && <source srcSet={darkImgSrc} type="image/png" />}
            <img
              src={imgSrc}
              alt={alt}
              className={mergeClasses(isSelected ? 'grayscale-0' : 'grayscale opacity-80')}
            />
          </picture>
        </div>
        <div className="p-3 text-center flex items-center justify-center flex-col gap-2">
          <HEADLINE className="text-center">{title}</HEADLINE>
          {description ? <CALLOUT theme="secondary">{description}</CALLOUT> : null}
          <div className="relative">
            <div
              className={mergeClasses(
                'size-5 rounded-full border bg-default',
                isSelected ? 'border-palette-blue9' : 'border-default'
              )}
            />
            <div
              className={mergeClasses(
                'size-3 rounded-full absolute top-1 right-1',
                isSelected ? 'border-palette-blue9 bg-palette-blue9' : 'bg-transparent'
              )}
            />
          </div>
        </div>
      </div>
    </ButtonBase>
  );
}
