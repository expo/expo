import { DataTableDemo } from '@/components/data-table';
import { useFilteredModules } from '../../components/deps-context';

export default function App() {
  return <DataTableDemo data={useFilteredModules()} />;
}
