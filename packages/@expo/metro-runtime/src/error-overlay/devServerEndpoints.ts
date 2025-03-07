export function openFileInEditor(file: string, lineNumber: number) {
  fetch('/open-stack-frame', {
    method: 'POST',
    body: JSON.stringify({ file, lineNumber }),
  });
}
