import { FileCode01Icon, FolderIcon } from '@expo/styleguide-icons';
import { HTMLAttributes, ReactNode } from 'react';

type FileTreeProps = HTMLAttributes<HTMLDivElement> & {
  files?: string[];
};

type FileObject = {
  [key: string]: FileObject;
};

export function FileTree({ files = [], ...rest }: FileTreeProps) {
  return (
    <div className="text-xs border border-default rounded-md bg-default mb-4 p-2 pb-4" {...rest}>
      {renderStructure(generateStructure(files))}
    </div>
  );
}

function generateStructure(files: string[]): FileObject {
  const structure = {};
  files.forEach(path =>
    path.split('/').reduce((acc: FileObject, key) => acc[key] ?? (acc[key] = {}), structure)
  );
  return structure;
}

function renderStructure(structure: FileObject, level = 0): ReactNode {
  return Object.entries(structure).map(([key, value]) => {
    return Object.keys(value).length ? (
      <div className="mt-1 pt-1 px-2 rounded-sm flex flex-col">
        <div className="flex items-center">
          {' '.repeat(level)}
          <FolderIcon className="text-icon-tertiary mr-2 opacity-60" />
          <code className="text-secondary">{key}</code>
        </div>
        {renderStructure(value, level + 1)}
      </div>
    ) : (
      <div className="mt-1 pl-3 pt-1 px-2 rounded-sm flex items-center">
        {' '.repeat(level - 1)}
        <FileCode01Icon className="text-icon-tertiary mr-2" />
        <code className="text-default">{key}</code>
      </div>
    );
  });
}
