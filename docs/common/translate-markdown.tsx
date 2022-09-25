import { createPermalinkedComponent } from './create-permalinked-component';

import { Code, InlineCode } from '~/components/base/code';
import { H1, H2, H3, H4 } from '~/components/base/headings';
import Link from '~/components/base/link';
import { UL, OL, LI } from '~/components/base/list';
import { PDIV, B, Quote } from '~/components/base/paragraph';
import { Cell, HeaderCell, Row, Table, TableHead } from '~/ui/components/Table';
import { KBD } from '~/ui/components/Text';

// When using inline markdown, we need to remove the document layout wrapper.
// Always set this to `null` to overwrite the global MDX provider.
export const wrapper = null;

export const p = PDIV;
export const strong = B;
export const ul = UL;
export const li = LI;
export const ol = OL;
export const h1 = createPermalinkedComponent(H1, { baseNestingLevel: 1 });
export const h2 = createPermalinkedComponent(H2, { baseNestingLevel: 2 });
export const h3 = createPermalinkedComponent(H3, { baseNestingLevel: 3 });
export const h4 = createPermalinkedComponent(H4, { baseNestingLevel: 4 });
export const code = InlineCode;
export const pre = Code;
export const a = Link;
export const blockquote = Quote;
export const table = Table;
export const thead = TableHead;
export const tr = Row;
export const th = HeaderCell;
export const td = Cell;
export const kbd = KBD;
