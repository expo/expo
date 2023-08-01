export function formatProjectFilePath(projectRoot, file) {
    if (file == null) {
        return '<unknown>';
    }
    return pathRelativeToPath(file.replace(/\\/g, '/'), projectRoot.replace(/\\/g, '/')).replace(/\?.*$/, '');
}
function pathRelativeToPath(path, relativeTo, sep = '/') {
    const relativeToParts = relativeTo.split(sep);
    const pathParts = path.split(sep);
    let i = 0;
    while (i < relativeToParts.length && i < pathParts.length) {
        if (relativeToParts[i] !== pathParts[i]) {
            break;
        }
        i++;
    }
    return pathParts.slice(i).join(sep);
}
export function getStackFormattedLocation(projectRoot, frame) {
    const column = frame.column != null && parseInt(String(frame.column), 10);
    const location = formatProjectFilePath(projectRoot, frame.file) +
        (frame.lineNumber != null
            ? ':' + frame.lineNumber + (column && !isNaN(column) ? ':' + (column + 1) : '')
            : '');
    return location;
}
//# sourceMappingURL=formatProjectFilePath.js.map