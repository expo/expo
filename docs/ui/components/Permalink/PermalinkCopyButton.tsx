import { Button, mergeClasses } from '@expo/styleguide';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

import { PermalinkIcon } from './PermalinkIcon';

import { useCopy } from '~/common/useCopy';
import { FOOTNOTE } from '~/ui/components/Text';

type Props = {
  slug: string;
  className?: string;
};

export function PermalinkCopyButton({ slug, className }: Props) {
  const [copyValue, setCopyValue] = useState('');
  const { copiedIsVisible, onCopy } = useCopy(copyValue);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setCopyValue(window.location.origin + window.location.pathname + '#' + slug);
  });

  return (
    <>
      <Button
        theme="quaternary"
        onClick={async event => {
          event.preventDefault();
          event.stopPropagation();
          await onCopy();
        }}
        className={mergeClasses(
          'items-center size-6 ml-1 align-middle -mt-0.5 justify-center px-0.5',
          className
        )}>
        <PermalinkIcon className="icon-sm" />
      </Button>
      <AnimatePresence>
        {copiedIsVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.15 }}
            className="absolute -right-1 top-[calc(50%-14px)]">
            <FOOTNOTE
              theme="success"
              className="absolute flex h-[28px] items-center rounded-md border border-success bg-success px-2">
              Copied!
            </FOOTNOTE>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
