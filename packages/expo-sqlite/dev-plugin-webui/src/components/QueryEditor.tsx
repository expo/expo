import { useState } from 'react';
import { Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/DataTable';
import type { QueryResult } from '@/types';
import { toast } from 'sonner';

interface QueryEditorProps {
  onExecuteQuery: (query: string) => Promise<QueryResult>;
}

export function QueryEditor({ onExecuteQuery }: QueryEditorProps) {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleExecute = async () => {
    if (!query.trim()) {
      toast.error('Please enter a query');
      return;
    }

    setLoading(true);
    try {
      const data = await onExecuteQuery(query);
      setResult(data);
    } catch (err: any) {
      toast.error(`Query failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Execute SQL Query</CardTitle>
          <CardDescription>Run custom SQL queries against the database</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="SELECT * FROM table_name"
            disabled={loading}
            className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
          />
          <Button onClick={handleExecute} disabled={loading} className="w-full sm:w-auto">
            <Play className="h-4 w-4 mr-2" />
            {loading ? 'Executing...' : 'Execute Query'}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
            <CardDescription>{result.rows.length} row(s) returned</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable data={result} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
