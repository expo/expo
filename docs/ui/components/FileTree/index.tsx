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
      className="border-default bg-default mb-4 overflow-x-auto rounded-md border p-2 pr-4 pb-4 text-sm whitespace-nowrap"
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
      modifyPath(path[0], path[1]);
    } else {
      modifyPath(path);
    }
  });

  return structure;
}

function renderStructure(structure: FileObject[], level = 0): ReactNode {
  return structure.map(({ name, note, files }, index) => {
    const FileIcon = getIconForFile(name);

    if (files.length > 0) {
      return (
        <div key={name + '_' + index} className="mt-1 flex flex-col rounded-sm pt-1 pl-2">
          <div className="flex items-center">
            {' '.repeat(level)}
            <FolderIcon className="text-icon-tertiary mr-2 min-w-[20px] opacity-60" />
            <TextWithNote name={name} note={note} className="text-secondary" />
          </div>
          {renderStructure(files, level + 1)}
        </div>
      );
    }

    if (name.length > 0) {
      return (
        <div key={name + '_' + index} className="mt-1 flex items-center rounded-sm pt-1 pl-2">
          {' '.repeat(Math.max(level, 0))}
          <FileIcon className="text-icon-tertiary mr-2 min-w-[20px]" />
          <TextWithNote name={name} note={note} className="text-default" />
        </div>
      );
    }

    return null;
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
