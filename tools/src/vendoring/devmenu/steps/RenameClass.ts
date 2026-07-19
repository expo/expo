import { Task } from './Task';
import { TransformFilesContent } from './TransformFilesContent';
import { TransformFilesName } from './TransformFilesName';

export function renameClass({
  filePattern,
  className,
  newClassName,
}: {
  filePattern: string;
  className: string;
  newClassName: string;
}): Task[] {
  return [
    new TransformFilesName({
      filePattern,
      find: className,
      replace: newClassName,
    }),
    new TransformFilesContent({
      filePattern,
      find: className,
      replace: newClassName,
    }),
  ];
}
