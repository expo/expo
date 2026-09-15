import {
  Children,
  type PropsWithChildren,
  type ReactElement,
  type ReactNode,
  isValidElement,
} from 'react';

import { toString } from '~/common/utilities';
import { buildFAQPageSchema } from '~/constants/structured-data';
import { markdownComponents } from '~/ui/components/Markdown';
import { StructuredData } from '~/ui/components/StructuredData';

type FAQItem = { question: string; answer: string };
type SummaryProps = { summary?: ReactNode; children?: ReactNode };
type TerminalProps = { cmd: string[] | Partial<Record<string, string[]>> };
type Section = { item: FAQItem; level: number; blocks: ReactNode[]; hasOwnText: boolean };

const HEADING_LEVELS = new Map<unknown, number>([
  [markdownComponents.h2, 2],
  [markdownComponents.h3, 3],
  [markdownComponents.h4, 4],
  [markdownComponents.h5, 5],
]);

export function FAQ({ children }: PropsWithChildren) {
  const schema = buildFAQPageSchema(collectItems(children));

  return (
    <>
      {schema && <StructuredData data={schema} id="faq" />}
      {children}
    </>
  );
}

function collectItems(children: ReactNode): FAQItem[] {
  const items: FAQItem[] = [];
  const openSections: Section[] = [];

  const closeSectionsAtOrBelow = (level: number) => {
    let innermost = openSections.at(-1);
    while (innermost && innermost.level >= level) {
      openSections.pop();
      if (innermost.hasOwnText) {
        innermost.item.answer = blocksToText(innermost.blocks);
      }
      innermost = openSections.at(-1);
    }
  };

  const appendToOpenSections = (child: ReactNode) => {
    for (const section of openSections) {
      section.blocks.push(child);
    }
  };

  Children.forEach(children, child => {
    const level = isValidElement(child) ? HEADING_LEVELS.get(child.type) : undefined;
    if (level !== undefined) {
      closeSectionsAtOrBelow(level);
      appendToOpenSections(child);
      const section: Section = {
        item: { question: toString(child), answer: '' },
        level,
        blocks: [],
        hasOwnText: false,
      };
      openSections.push(section);
      items.push(section.item);
      return;
    }
    if (hasSummary(child)) {
      items.push({
        question: toString(child.props.summary),
        answer: blocksToText(Children.toArray(child.props.children)),
      });
    } else {
      const innermost = openSections.at(-1);
      if (innermost) {
        innermost.hasOwnText = true;
      }
    }
    appendToOpenSections(child);
  });
  closeSectionsAtOrBelow(0);

  return items.filter(item => item.answer.length > 0);
}

function hasSummary(node: ReactNode): node is ReactElement<SummaryProps> {
  return isValidElement<SummaryProps>(node) && node.props.summary !== undefined;
}

function hasCmd(node: ReactNode): node is ReactElement<TerminalProps> {
  return isValidElement<Partial<TerminalProps>>(node) && node.props.cmd !== undefined;
}

function blockText(block: ReactNode): string {
  if (hasSummary(block)) {
    return [block.props.summary, block.props.children].map(toString).join(' ');
  }
  if (hasCmd(block)) {
    const { cmd } = block.props;
    return (Array.isArray(cmd) ? cmd : (Object.values(cmd)[0] ?? [])).join(' ');
  }
  return toString(block);
}

function blocksToText(blocks: ReactNode[]): string {
  return blocks
    .map(blockText)
    .join(' ')
    .replace(/@@@(.*?)@@@/g, '$1 ')
    .replace(/\s+/g, ' ')
    .trim();
}
