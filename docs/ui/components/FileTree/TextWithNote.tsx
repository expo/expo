export function TextWithNote({
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
          <span className="flex-1 border-b border-default opacity-60 mx-3 min-w-8 max-md-gutters:mx-2" />
          {/* Optional note */}
          <code className="text-default">{note}</code>
        </>
      )}
    </span>
  );
}
