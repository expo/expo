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
    <span className="flex flex-1 items-center">
      {/* File/folder name  */}
      <code className={className}>{name}</code>
      {note && (
        <>
          {/* divider pushing  */}
          <span className="mx-3 min-w-8 flex-1 border-b border-default opacity-60 max-md-gutters:mx-2" />
          {/* Optional note */}
          <code className="text-default">{note}</code>
        </>
      )}
    </span>
  );
}
