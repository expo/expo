import { useState } from 'react';

import { FileUpload } from '@/components/FileUpload';
import { LocalDatabaseViewer } from '@/components/LocalDatabaseViewer';
import { RemoteDatabaseViewer } from '@/components/RemoteDatabaseViewer';
import { Toaster } from '@/components/ui/sonner';

type ViewerMode =
  | { type: 'none' }
  | { type: 'local'; file: File }
  | { type: 'remote'; path: string; name: string };

export default function App() {
  const [viewerMode, setViewerMode] = useState<ViewerMode>({ type: 'none' });

  const handleFileSelected = (file: File) => {
    setViewerMode({ type: 'local', file });
  };

  const handleDatabaseSelected = (data: Uint8Array, name: string, path: string) => {
    setViewerMode({ type: 'remote', path, name });
  };

  const handleClose = () => {
    setViewerMode({ type: 'none' });
  };

  if (viewerMode.type === 'none') {
    return (
      <>
        <FileUpload
          onFileSelected={handleFileSelected}
          onDatabaseSelected={handleDatabaseSelected}
          loading={false}
        />
        <Toaster />
      </>
    );
  }

  return (
    <>
      {viewerMode.type === 'local' ? (
        <LocalDatabaseViewer initialFile={viewerMode.file} onClose={handleClose} />
      ) : (
        <RemoteDatabaseViewer
          databasePath={viewerMode.path}
          databaseName={viewerMode.name}
          onClose={handleClose}
        />
      )}
      <Toaster />
    </>
  );
}
