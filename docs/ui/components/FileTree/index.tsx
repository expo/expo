import { FileCode01Icon, LayoutAlt01Icon, FolderIcon } from '@expo/styleguide-icons';
import { HTMLAttributes, ReactNode } from 'react';

type FileTreeProps = HTMLAttributes<HTMLDivElement> & {
  files?: (string | [string, string])[];
};

type FileObject = {
  name: string;
  note?: string;
  files: FileObject[];
};

export function FileTree({ files = [], ...rest }: FileTreeProps) {
  return (
    <div
      className="text-xs border border-default rounded-md bg-default mb-4 p-2 pr-4 pb-4 whitespace-nowrap overflow-x-auto"
      {...rest}>
      {renderStructure(generateStructure(files))}
    </div>
  );
}

/**
 * Given an array of file paths, generate a tree structure.
 * @param files
 * @returns
 */
function generateStructure(files: (string | [string, string])[]): FileObject[] {
  const structure: FileObject[] = [];

  function modifyPath(path: string, note?: string) {
    const parts = path.split('/');
    let currentLevel = structure;
    parts.forEach((part, index) => {
      const existingPath = currentLevel.find(item => item.name === part);
      if (existingPath) {
        currentLevel = existingPath.files;
      } else {
        const newPart: FileObject = {
          name: part,
          files: [],
        };
        if (note && index === parts.length - 1) {
          newPart.note = note;
        }
        currentLevel.push(newPart);
        currentLevel = newPart.files;
      }
    });
  }

  files.forEach(path => {
    if (Array.isArray(path)) {
      return modifyPath(path[0], path[1]);
    } else {
      return modifyPath(path);
    }
  });

  return structure;
}

function renderStructure(structure: FileObject[], level = 0): ReactNode {
  return structure.map(({ name, note, files }, index) => {
    const FileIcon = getIconForFile(name);
    return files.length ? (
      <div key={name + '_' + index} className="mt-1 pt-1 pl-2 rounded-sm flex flex-col">
        <div className="flex items-center">
          {' '.repeat(level)}
          <FolderIcon className="text-icon-tertiary mr-2 opacity-60 min-w-[20px]" />
          <TextWithNote name={name} note={note} className="text-secondary" />
        </div>
        {renderStructure(files, level + 1)}
      </div>
    ) : (
      <div className="mt-1 pt-1 pl-2 rounded-sm flex items-center">
        {' '.repeat(Math.max(level, 0))}
        <FileIcon className="text-icon-tertiary mr-2 min-w-[20px]" />
        <TextWithNote name={name} note={note} className="text-default" />
      </div>
    );
  });
}

function TextWithNote({
  name,
  note,
  className,
}: {
  name: string;
  note?: string;
  className: string;
}) {
  return (
    <span className="flex items-center flex-1">
      {/* File/folder name  */}
      <code className={className}>{name}</code>

      {note && (
        <>
          {/* divider pushing  */}
          <span className="flex-1 border-b border-default opacity-60 mx-2 md:mx-3 min-w-[2rem]" />
          {/* Optional note */}
          <code className="text-default">{note}</code>
        </>
      )}
    </span>
  );
}

function getIconForFile(filename: string) {
  if (/_layout\.[jt]sx?/.test(filename)) {
    return LayoutAlt01Icon;
  }
  return FileCode01Icon;
}
