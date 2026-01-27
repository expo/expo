import { useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { ColumnInfo } from '@/types';
import { toast } from 'sonner';

interface InsertFormProps {
  tableName: string;
  schema: ColumnInfo[];
  onInsert: (values: Record<string, any>) => Promise<void>;
}

export function InsertForm({ tableName, schema, onInsert }: InsertFormProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const insertValues: Record<string, any> = {};

    for (const col of schema) {
      const value = values[col.name];
      if (value !== undefined && value !== '') {
        insertValues[col.name] = value;
      } else if (col.notnull && !col.pk) {
        toast.error(`Column ${col.name} is required!`);
        return;
      }
    }

    setLoading(true);
    try {
      await onInsert(insertValues);
      setValues({});
    } catch (err: any) {
      toast.error(`Failed to insert row: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {schema.map((col) => (
        <div key={col.name} className="space-y-2">
          <label htmlFor={col.name} className="text-sm font-medium flex items-center gap-2">
            {col.name}
            {col.notnull && !col.pk && (
              <Badge variant="destructive" className="text-[10px] py-0">
                Required
              </Badge>
            )}
            {col.pk && (
              <Badge variant="secondary" className="text-[10px] py-0">
                Primary Key
              </Badge>
            )}
            <span className="text-muted-foreground font-normal">({col.type})</span>
          </label>
          <Input
            id={col.name}
            value={values[col.name] || ''}
            onChange={(e) => setValues({ ...values, [col.name]: e.target.value })}
            placeholder={
              col.pk ? 'Auto-generated' : col.dflt_value ? `Default: ${col.dflt_value}` : ''
            }
            disabled={!!col.pk || loading}
          />
        </div>
      ))}
      <Button type="submit" className="w-full" disabled={loading}>
        <PlusCircle className="h-4 w-4 mr-2" />
        {loading ? 'Inserting...' : 'Insert Row'}
      </Button>
    </form>
  );
}
