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
      'flex flex-col group items-center justify-center p-6 gap-1.5 rounded-md border border-default shadow-xs transition-all',
      'hocus:shadow-md hocus:scale-105'
    )}
    isStyled>
    <Icon title={title} image={image} />
    <RawH4 className="!mt-1 text-center">{title}</RawH4>
    {(protocol || []).length && (
      <CALLOUT
        theme="secondary"
        className={mergeClasses(
          'relative opacity-0 top-1.5 transition-all duration-300',
          'group-hover:opacity-75 group-hover:top-0 group-hover:scale-100'
        )}>
        {protocol.join(' | ')}
      </CALLOUT>
    )}
  </A>
);
