import { FileCode01Icon } from '@expo/styleguide-icons/outline/FileCode01Icon';
import { FolderIcon } from '@expo/styleguide-icons/outline/FolderIcon';
import { LayoutAlt01Icon } from '@expo/styleguide-icons/outline/LayoutAlt01Icon';
import { PackageIcon } from '@expo/styleguide-icons/outline/PackageIcon';
import { HTMLAttributes, ReactNode } from 'react';

import { TextWithNote } from './TextWithNote';

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
      className="mb-4 overflow-x-auto whitespace-nowrap rounded-md border border-default bg-default p-2 pb-4 pr-4 text-xs"
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
function generateStructure(files: FileTreeProps['files'] = []): FileObject[] {
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
      <div key={name + '_' + index} className="mt-1 flex flex-col rounded-sm pl-2 pt-1">
        <div className="flex items-center">
          {' '.repeat(level)}
          <FolderIcon className="mr-2 min-w-[20px] text-icon-tertiary opacity-60" />
          <TextWithNote name={name} note={note} className="text-secondary" />
        </div>
        {renderStructure(files, level + 1)}
      </div>
    ) : (
      <div key={name + '_' + index} className="mt-1 flex items-center rounded-sm pl-2 pt-1">
        {' '.repeat(Math.max(level, 0))}
        <FileIcon className="mr-2 min-w-[20px] text-icon-tertiary" />
        <TextWithNote name={name} note={note} className="text-default" />
      </div>
    );
  });
}

function getIconForFile(filename: string) {
  if (/_layout\.[jt]sx?/.test(filename)) {
    return LayoutAlt01Icon;
  }
  if (filename.startsWith('expo-')) {
    return PackageIcon;
  }
  return FileCode01Icon;
}
