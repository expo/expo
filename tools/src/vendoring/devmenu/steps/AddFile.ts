import fs from 'fs-extra';

import { toRepoPath } from '../utils';
import { Task } from './Task';

type AddFileSettings = {
  destination: string;
  content: string;
};

export class AddFile extends Task {
  protected readonly destination: string;
  protected readonly content: string;

  constructor({ destination, content }: AddFileSettings) {
    super();
    this.destination = destination;
    this.content = content;
  }

  async execute() {
    this.logSubStep(`➕ adding file ${this.destination}`);
    return await fs.writeFile(toRepoPath(this.destination), this.content);
  }
}
