import { mergeClasses } from '@expo/styleguide';

type FileStatusProps = {
  type: 'add' | 'modify' | 'delete' | 'rename';
};

const STATUS_LABELS = {
  add: 'ADDED',
  modify: 'MODIFIED',
  delete: 'DELETED',
  rename: 'RENAMED',
};

export const FileStatus = ({ type }: FileStatusProps) => {
  return (
    <div
      className={mergeClasses(
        'inline-flex font-semibold h-[21px] text-3xs py-1 px-1.5 rounded-sm border gap-1 items-center',
        getStatusTheme(type)
      )}>
      {STATUS_LABELS[type as keyof typeof STATUS_LABELS]}
    </div>
  );
};

function getStatusTheme(type: FileStatusProps['type']) {
  switch (type) {
    case 'add':
      return 'text-success bg-palette-green2 border-success';
    case 'modify':
      return 'text-warning bg-palette-yellow2 border-warning';
    case 'delete':
      return 'text-danger bg-palette-red2 border-danger';
    default:
      return 'text-secondary bg-element border-default';
  }
}
