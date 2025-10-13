import { Button, mergeClasses } from '@expo/styleguide';
import { CheckIcon } from '@expo/styleguide-icons/outline/CheckIcon';
import { ClipboardIcon } from '@expo/styleguide-icons/outline/ClipboardIcon';
import type { AnchorHTMLAttributes, ComponentType, MouseEvent } from 'react';
import { useMemo, useState, useEffect } from 'react';
import type { Components } from 'react-markdown';

import { cleanCopyValue, getCodeBlockDataFromChildren } from '~/common/code-utilities';
import { markdownComponents as docsMarkdownComponents } from '~/ui/components/Markdown';

type UseChatMarkdownComponentsOptions = {
  onNavigate: (event?: MouseEvent<HTMLAnchorElement>) => void;
};

export function useChatMarkdownComponents({ onNavigate }: UseChatMarkdownComponentsOptions) {
  return useMemo<Components>(() => {
    const AnchorComponent =
      (docsMarkdownComponents.a as ComponentType<AnchorHTMLAttributes<HTMLAnchorElement>>) ?? 'a';
    const ParagraphComponent = (docsMarkdownComponents.p as ComponentType<any>) ?? 'p';
    const OrderedListComponent = (docsMarkdownComponents.ol as ComponentType<any>) ?? 'ol';
    const UnorderedListComponent = (docsMarkdownComponents.ul as ComponentType<any>) ?? 'ul';
    const ListItemComponent = (docsMarkdownComponents.li as ComponentType<any>) ?? 'li';
    const Heading1Component = (docsMarkdownComponents.h1 as ComponentType<any>) ?? 'h1';
    const Heading2Component = (docsMarkdownComponents.h2 as ComponentType<any>) ?? 'h2';
    const Heading3Component = (docsMarkdownComponents.h3 as ComponentType<any>) ?? 'h3';
    const Heading4Component = (docsMarkdownComponents.h4 as ComponentType<any>) ?? 'h4';
    const Heading5Component = (docsMarkdownComponents.h5 as ComponentType<any>) ?? 'h5';
    const PreComponent = (docsMarkdownComponents.pre as ComponentType<any>) ?? 'pre';

    const ChatPre: ComponentType<any> = preProps => {
      const { value } = useMemo(
        () => getCodeBlockDataFromChildren(preProps.children, preProps.className),
        [preProps.children, preProps.className]
      );
      const codeToCopy = useMemo(() => cleanCopyValue(value ?? ''), [value]);
      const [copied, setCopied] = useState(false);

      useEffect(() => {
        if (!copied) {
          return undefined;
        }
        const timer = setTimeout(() => {
          setCopied(false);
        }, 2000);
        return () => {
          clearTimeout(timer);
        };
      }, [copied]);

      const handleCopy = () => {
        if (!codeToCopy) {
          return;
        }
        void navigator.clipboard?.writeText(codeToCopy);
        setCopied(true);
      };

      return (
        <div className="relative">
          <PreComponent {...preProps} className={mergeClasses('px-3 py-2', preProps.className)} />
          <Button
            type="button"
            theme="quaternary"
            size="xs"
            className="pointer-events-auto absolute right-2 top-2 z-10 flex size-7 items-center justify-center rounded-full !border !border-default !bg-default !p-0 shadow-sm"
            onClick={handleCopy}
            aria-label="Copy code block">
            {copied ? (
              <CheckIcon className="icon-xs text-success" aria-hidden />
            ) : (
              <ClipboardIcon className="icon-xs text-icon-secondary" aria-hidden />
            )}
          </Button>
        </div>
      );
    };

    return {
      ...docsMarkdownComponents,
      h1: props => (
        <Heading1Component
          {...props}
          className={mergeClasses('!text-[14px] font-semibold text-default', props.className)}
        />
      ),
      h2: props => (
        <Heading2Component
          {...props}
          className={mergeClasses('!text-[14px] font-semibold text-default', props.className)}
        />
      ),
      h3: props => (
        <Heading3Component
          {...props}
          className={mergeClasses('!text-[12px] font-semibold text-default', props.className)}
        />
      ),
      h4: props => (
        <Heading4Component
          {...props}
          className={mergeClasses('!text-[12px] font-semibold text-default', props.className)}
        />
      ),
      h5: props => (
        <Heading5Component
          {...props}
          className={mergeClasses('!text-[10px] font-semibold text-default', props.className)}
        />
      ),
      p: ({ className, style, ...rest }) => (
        <ParagraphComponent
          {...rest}
          style={{ ...(style ?? {}), fontSize: '14px', lineHeight: '1.5' }}
          className={mergeClasses(
            '!mb-2 text-secondary',
            className,
            '!text-[10px] !leading-[1.55]'
          )}
        />
      ),
      ol: ({ className, style, ...rest }) => (
        <OrderedListComponent
          {...rest}
          style={{ ...(style ?? {}), fontSize: '14px', lineHeight: '1.5' }}
          className={mergeClasses('text-secondary', className, '!text-[10px] leading-normal')}
        />
      ),
      ul: ({ className, style, ...rest }) => (
        <UnorderedListComponent
          {...rest}
          style={{ ...(style ?? {}), fontSize: '14px', lineHeight: '1.5' }}
          className={mergeClasses('text-secondary', className, '!text-[10px] leading-normal')}
        />
      ),
      li: ({ className, style, ...rest }) => (
        <ListItemComponent
          {...rest}
          style={{ ...(style ?? {}), fontSize: '14px', lineHeight: '1.45' }}
          className={mergeClasses('text-secondary', className, '!text-[10px] !leading-[1.45]')}
        />
      ),
      sup: () => null,
      section: ({ className, children, ...props }: any) => {
        if (className?.includes('footnotes')) {
          return null;
        }
        return (
          <section className={className} {...props}>
            {children}
          </section>
        );
      },
      hr: ({ className, ...props }: any) => {
        if (className?.includes('footnotes-sep')) {
          return null;
        }
        const HR = (docsMarkdownComponents.hr as ComponentType<any>) ?? 'hr';
        return <HR className={className} {...props} />;
      },
      a: ({
        href,
        children,
        onClick: originalOnClick,
        ...props
      }: AnchorHTMLAttributes<HTMLAnchorElement>) => (
        <AnchorComponent
          {...props}
          href={href ?? '#'}
          onClick={(event: MouseEvent<HTMLAnchorElement>) => {
            originalOnClick?.(event);
            if (
              event.defaultPrevented ||
              event.metaKey ||
              event.ctrlKey ||
              event.shiftKey ||
              event.button !== 0
            ) {
              return;
            }
            onNavigate(event);
          }}>
          {children}
        </AnchorComponent>
      ),
      pre: ChatPre,
    } as Components;
  }, [onNavigate]);
}
