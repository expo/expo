export function openDatabase(fileInfo, ...args) {
  let name = fileInfo;

  if (typeof fileInfo !== 'string') {
    name = fileInfo.name;
  }

  global.openDatabase(name, ...args);
}

export default { openDatabase };
