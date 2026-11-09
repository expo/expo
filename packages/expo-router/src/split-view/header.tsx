import type { SplitViewHeader } from './elements';
import { SplitViewNativeHeader } from './native';

export function SplitViewColumnHeader({ header }: { header: SplitViewHeader }) {
  const { title, largeTitle } = header;
  return <SplitViewNativeHeader title={title} largeTitle={largeTitle} />;
}
