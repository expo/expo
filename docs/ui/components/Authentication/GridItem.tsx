import { mergeClasses } from '@expo/styleguide';

import { Icon } from './Icon';

import { A, CALLOUT, RawH4 } from '~/ui/components/Text';

type GridItemProps = React.PropsWithChildren<{
  title: string;
  image?: string;
  href?: string;
  protocol: string[];
}>;

export const GridItem = ({
  title,
  image,
  protocol = [],
  href = `#${title.toLowerCase().replaceAll(' ', '-')}`,
}: GridItemProps) => (
  <A
    href={href}
    className={mergeClasses(
      'group flex flex-col items-center justify-center gap-1.5 rounded-md border border-default p-6 shadow-xs transition-all',
      'hocus:scale-105 hocus:shadow-md'
    )}
    isStyled>
    <Icon title={title} image={image} />
    <RawH4 className="!mt-1 text-center">{title}</RawH4>
    {(protocol || []).length && (
      <CALLOUT
        theme="secondary"
        className={mergeClasses(
          'relative top-1.5 opacity-0 transition-all duration-300',
          'group-hover:top-0 group-hover:scale-100 group-hover:opacity-75'
        )}>
        {protocol.join(' | ')}
      </CALLOUT>
    )}
  </A>
);
