import { Edit, Plus, RefreshCw, Save, Search, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface KVStoreBrowserProps {
  onGetKeys: () => Promise<string[]>;
  onGetItem: (key: string) => Promise<string | null>;
  onSetItem: (key: string, value: string) => Promise<void>;
  onRemoveItem: (key: string) => Promise<boolean>;
  onClear: () => Promise<void>;
  onGetLength: () => Promise<number>;
}

export function KVStoreBrowser({
  onGetKeys,
  onGetItem,
  onSetItem,
  onRemoveItem,
  onClear,
  onGetLength,
}: KVStoreBrowserProps) {
  const [keys, setKeys] = useState<string[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [selectedValue, setSelectedValue] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [insertDialogOpen, setInsertDialogOpen] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [count, setCount] = useState(0);

  const loadKeys = useCallback(async () => {
    setLoading(true);
    try {
      const [allKeys, length] = await Promise.all([onGetKeys(), onGetLength()]);
      setKeys(allKeys);
      setCount(length);
    } catch (err: any) {
      toast.error(`Failed to load keys: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [onGetKeys, onGetLength]);

  const loadValue = useCallback(
    async (key: string) => {
      setLoading(true);
      try {
        const value = await onGetItem(key);
        setSelectedKey(key);
        setSelectedValue(value || '');
        setEditingKey(null);
      } catch (err: any) {
        toast.error(`Failed to load value: ${err.message}`);
      } finally {
        setLoading(false);
      }
    },
    [onGetItem]
  );

  const handleSave = async () => {
    if (!editingKey) return;

    try {
      await onSetItem(editingKey, editingValue);
      toast('Value updated successfully!');
      setSelectedValue(editingValue);
      setEditingKey(null);
      await loadKeys();
    } catch (err: any) {
      toast.error(`Failed to update value: ${err.message}`);
    }
  };

  const handleDelete = async (key: string) => {
    if (!confirm(`Are you sure you want to delete key "${key}"?`)) {
      return;
    }

    try {
      await onRemoveItem(key);
      toast('Key deleted successfully!');
      if (selectedKey === key) {
        setSelectedKey(null);
        setSelectedValue('');
      }
      await loadKeys();
    } catch (err: any) {
      toast.error(`Failed to delete key: ${err.message}`);
    }
  };

  const handleInsert = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newKey.trim()) {
      toast.error('Key cannot be empty');
      return;
    }

    try {
      await onSetItem(newKey, newValue);
      toast('Key-value pair inserted successfully!');
      setInsertDialogOpen(false);
      setNewKey('');
      setNewValue('');
      await loadKeys();
    } catch (err: any) {
      toast.error(`Failed to insert: ${err.message}`);
    }
  };

  const handleClear = async () => {
    if (!confirm('Are you sure you want to clear all key-value pairs? This cannot be undone!')) {
      return;
    }

    try {
      await onClear();
      toast('Storage cleared successfully!');
      setSelectedKey(null);
      setSelectedValue('');
      await loadKeys();
    } catch (err: any) {
      toast.error(`Failed to clear storage: ${err.message}`);
    }
  };

  const formatValue = (value: string): { formatted: string; isJSON: boolean } => {
    try {
      const parsed = JSON.parse(value);
      return { formatted: JSON.stringify(parsed, null, 2), isJSON: true };
    } catch {
      return { formatted: value, isJSON: false };
    }
  };

  const filteredKeys = keys.filter((key) => key.toLowerCase().includes(searchText.toLowerCase()));

  useEffect(() => {
    loadKeys();
  }, [loadKeys]);

  return (
    <div className="flex h-full">
      {/* Keys List Panel */}
      <div className="w-80 border-r bg-card flex flex-col">
        <Card className="border-0 rounded-none shadow-none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>KV Store</CardTitle>
                <CardDescription>
                  {count} key{count !== 1 ? 's' : ''}
                </CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={loadKeys} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search keys..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={() => setInsertDialogOpen(true)} className="flex-1">
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
              <Button
                onClick={handleClear}
                variant="outline"
                className="flex-1 text-destructive hover:bg-destructive/5 hover:text-destructive">
                Clear All
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex-1 overflow-auto px-6">
          {filteredKeys.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {searchText ? 'No keys found' : 'No keys in storage'}
            </p>
          ) : (
            <div className="space-y-1">
              {filteredKeys.map((key) => (
                <div
                  key={key}
                  className={`flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-accent ${
                    selectedKey === key ? 'bg-accent' : ''
                  }`}
                  onClick={() => loadValue(key)}>
                  <span className="text-sm truncate flex-1" title={key}>
                    {key}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(key);
                    }}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Value Editor Panel */}
      <div className="flex-1 flex flex-col">
        {selectedKey ? (
          <>
            <Card className="border-0 rounded-none shadow-none border-b">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">Key: {selectedKey}</CardTitle>
                    {formatValue(selectedValue).isJSON && (
                      <Badge variant="outline" className="text-xs">
                        JSON
                      </Badge>
                    )}
                  </div>
                  {editingKey ? (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSave}>
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingKey(null)}>
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingKey(selectedKey);
                        setEditingValue(selectedValue);
                      }}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  )}
                </div>
              </CardHeader>
            </Card>

            <div className="flex-1 overflow-auto p-6">
              {editingKey ? (
                <textarea
                  value={editingValue}
                  onChange={(e) => setEditingValue(e.target.value)}
                  className="w-full h-full p-4 border rounded-md font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter value..."
                />
              ) : (
                <pre className="w-full h-full p-4 border rounded-md bg-muted font-mono text-sm overflow-auto">
                  {formatValue(selectedValue).formatted}
                </pre>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-lg text-muted-foreground">Select a key to view its value</p>
            </div>
          </div>
        )}
      </div>

      {/* Insert Dialog */}
      <Dialog open={insertDialogOpen} onOpenChange={setInsertDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Key-Value Pair</DialogTitle>
            <DialogDescription>Insert a new key-value pair into the storage</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleInsert} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="key" className="text-sm font-medium">
                Key
              </label>
              <Input
                id="key"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="Enter key..."
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="value" className="text-sm font-medium">
                Value
              </label>
              <textarea
                id="value"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="Enter value (can be JSON)..."
                className="w-full h-40 p-3 border rounded-md font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <Button type="submit" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Insert
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
