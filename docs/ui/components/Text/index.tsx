import { LinkBase, LinkBaseProps, mergeClasses } from '@expo/styleguide';
import { PropsWithChildren, ComponentType, Children, isValidElement } from 'react';

import { TextComponentProps, TextElement, TextTheme } from './types';

import { AdditionalProps, HeadingType } from '~/common/headingManager';
import { Permalink } from '~/ui/components/Permalink';

export { AnchorContext } from './withAnchor';

const isDev = process.env.NODE_ENV === 'development';

const CRAWLABLE_HEADINGS = ['h1', 'h2', 'h3', 'h4', 'h5'];
const CRAWLABLE_TEXT = ['span', 'p', 'li', 'blockquote', 'code', 'pre'];

type PermalinkedComponentProps = PropsWithChildren<
  { level?: number; id?: string } & AdditionalProps & TextComponentProps
>;

export const createPermalinkedComponent = (
  BaseComponent: ComponentType<PropsWithChildren<TextComponentProps>>,
  options?: {
    baseNestingLevel?: number;
    sidebarType?: HeadingType;
    iconSize?: 'sm' | 'xs';
    className?: string;
  }
) => {
  const { baseNestingLevel, iconSize = 'sm', sidebarType = HeadingType.Text } = options || {};
  return ({ children, level, id, className, ...props }: PermalinkedComponentProps) => {
    const cleanChildren = Children.map(children, child => {
      if (isValidElement(child) && child?.props?.href) {
        isDev &&
          console.warn(
            `It looks like the header on this page includes a link, this is an invalid pattern, nested link will be removed!`,
            child?.props?.href
          );
        return (child as JSX.Element)?.props?.children;
      }
      return child;
    });
    const nestingLevel = baseNestingLevel != null ? (level ?? 0) + baseNestingLevel : undefined;
    return (
      <Permalink
        nestingLevel={nestingLevel}
        additionalProps={{
          ...props,
          sidebarType,
          iconSize,
          className: mergeClasses(className, options?.className),
        }}
        id={id}>
        <BaseComponent>{cleanChildren}</BaseComponent>
      </Permalink>
    );
  };
};

export function createTextComponent(Element: TextElement, textClassName?: string) {
  function TextComponent(props: TextComponentProps) {
    const {
      testID,
      tag,
      className,
      weight: textWeight,
      theme: textTheme,
      crawlable = true,
      ...rest
    } = props;
    const TextElementTag = tag ?? Element;

    return (
      <TextElementTag
        className={mergeClasses(
          'text-inherit text-default leading-[1.6154]',
          textClassName,
          getTextWeightClassName(textWeight),
          getTextColorClassName(textTheme),
          className
        )}
        data-testid={testID}
        data-heading={(crawlable && CRAWLABLE_HEADINGS.includes(TextElementTag)) || undefined}
        data-text={(crawlable && CRAWLABLE_TEXT.includes(TextElementTag)) || undefined}
        {...rest}
      />
    );
  }
  TextComponent.displayName = `Text(${Element})`;
  return TextComponent;
}

const isExternalLink = (href?: string) => href?.includes('://');

export const A = (props: LinkBaseProps & { isStyled?: boolean; shouldLeakReferrer?: boolean }) => {
  const { isStyled, openInNewTab, shouldLeakReferrer, className, ...rest } = props;

  return (
    <LinkBase
      className={mergeClasses(
        'cursor-pointer decoration-0',
        'hocus:opacity-80',
        !isStyled &&
          'font-normal text-link visited:text-link hocus:underline [&_code]:hocus:underline',
        !isStyled &&
          '[&_span]:text-link [&_code]:text-link [&_strong]:text-link [&_em]:text-link [&_b]:text-link [&_i]:text-link',
        className
      )}
      {...(shouldLeakReferrer && { target: '_blank', referrerPolicy: 'origin' })}
      openInNewTab={(!shouldLeakReferrer && openInNewTab) ?? isExternalLink(props.href)}
      {...rest}
    />
  );
};
A.displayName = 'Text(a)';

function getTextWeightClassName(weight?: string) {
  switch (weight) {
    case 'black':
      return 'font-black';
    case 'semiBold':
      return 'font-semiBold';
    case 'medium':
      return 'font-medium';
    case 'regular':
      return 'font-normal';
    default:
      return undefined;
  }
}

function getTextColorClassName(theme?: TextTheme) {
  switch (theme) {
    case 'default':
      return 'text-default';
    case 'secondary':
      return 'text-secondary';
    case 'tertiary':
      return 'text-tertiary';
    case 'quaternary':
      return 'text-quaternary';
    case 'success':
      return 'text-success';
    case 'danger':
      return 'text-danger';
    case 'warning':
      return 'text-warning';
    case 'info':
      return 'text-info';
    case 'link':
      return 'text-link';
    default:
      return undefined;
  }
}

export const H1 = createTextComponent(
  TextElement.H1,
  mergeClasses(
    'text-[31px] font-bold leading-[1.29] tracking-[-0.022rem]',
    'my-2 [&_code]:text-[90%]',
    'max-md-gutters:text-[27px] max-md-gutters:leading-[1.3333]',
    'max-sm-gutters:text-[23px] max-sm-gutters:leading-[1.3913]'
  )
);
export const RawH2 = createTextComponent(
  TextElement.H2,
  mergeClasses(
    'text-[25px] font-bold leading-[1.4] tracking-[-0.021rem]',
    'mt-8 mb-3.5 [&_code]:text-[90%]',
    'max-md-gutters:text-[22px] max-md-gutters:leading-[1.409]',
    'max-sm-gutters:text-[19px] max-sm-gutters:leading-[1.5263]'
  )
);
export const RawH3 = createTextComponent(
  TextElement.H3,
  mergeClasses(
    'text-[20px] font-semibold leading-normal tracking-[-0.017rem]',
    'mt-7 mb-3 [&_code]:text-[90%]',
    'max-md-gutters:text-[18px] max-md-gutters:leading-[1.5555]',
    'max-sm-gutters:text-[16px] max-sm-gutters:leading-relaxed'
  )
);
export const RawH4 = createTextComponent(
  TextElement.H4,
  mergeClasses(
    'text-[16px] font-semibold leading-relaxed tracking-[-0.011rem]',
    'mt-6 mb-2 [&_code]:text-[90%]'
  )
);
export const RawH5 = createTextComponent(
  TextElement.H5,
  mergeClasses(
    'text-[13px] font-medium leading-[1.5833] tracking-[-0.003rem]',
    'mt-4 mb-1 [&_code]:text-[90%]'
  )
);

export const P = createTextComponent(
  TextElement.P,
  'font-normal text-[16px] leading-[1.625] tracking-[-0.011rem] [&_strong]:break-words'
);
export const CODE = createTextComponent(
  TextElement.CODE,
  mergeClasses(
    'text-[13px] font-normal leading-[130%] tracking-[-0.003rem]',
    'inline-block rounded-md border border-secondary bg-subtle px-1 py-0.5'
  )
);
export const LI = createTextComponent(
  TextElement.LI,
  mergeClasses('text-[16px] font-normal leading-relaxed tracking-[-0.011rem]', 'mb-2')
);
export const HEADLINE = createTextComponent(
  TextElement.P,
  'font-medium text-[16px] leading-[1.625] tracking-[-0.011rem]'
);
export const LABEL = createTextComponent(
  TextElement.SPAN,
  'font-medium text-[15px] leading-[1.6] tracking-[-0.009rem]'
);
export const CALLOUT = createTextComponent(
  TextElement.P,
  'font-normal text-[14px] leading-[1.5715] tracking-[-0.006rem]'
);
export const SPAN = createTextComponent(
  TextElement.SPAN,
  'font-normal text-[14px] leading-[1.5715] tracking-[-0.006rem]'
);
export const FOOTNOTE = createTextComponent(
  TextElement.P,
  'font-normal text-[13px] leading-[1.6154] tracking-[-0.003rem]'
);
export const CAPTION = createTextComponent(
  TextElement.P,
  'font-normal text-[12px] leading-[1.6154]'
);
export const BOLD = createTextComponent(TextElement.SPAN, 'font-semibold');
export const DEMI = createTextComponent(TextElement.SPAN, 'font-medium');
export const UL = createTextComponent(
  TextElement.UL,
  'list-disc ml-6 [&_ol]:mt-2 [&_ol]:mb-4 [&_ul]:mt-2 [&_ul]:mb-4'
);
export const OL = createTextComponent(
  TextElement.OL,
  'list-disc ml-6 [&_ol]:mt-2 [&_ol]:mb-4 [&_ul]:mt-2 [&_ul]:mb-4'
);
export const KBD = createTextComponent(
  TextElement.KBD,
  mergeClasses(
    'relative -top-px inline-block min-h-[20px] min-w-[22px] rounded-sm border border-secondary bg-subtle px-1 shadow-kbd',
    'text-center text-2xs font-semibold leading-[20px] text-secondary',
    'dark:bg-element'
  )
);
export const MONOSPACE = createTextComponent(TextElement.CODE);
export const DEL = createTextComponent(
  TextElement.DEL,
  mergeClasses('line-through [&_code]:line-through')
);

export const H2 = createPermalinkedComponent(RawH2, { baseNestingLevel: 2 });
export const H3 = createPermalinkedComponent(RawH3, { baseNestingLevel: 3 });
export const H4 = createPermalinkedComponent(RawH4, { baseNestingLevel: 4 });
export const H5 = createPermalinkedComponent(RawH5, { baseNestingLevel: 5 });
