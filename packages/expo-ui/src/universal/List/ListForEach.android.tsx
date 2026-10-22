import { createLazyItems } from '../../jetpack-compose/LazyItems';

/**
 * Android implementation of `List.ForEach`.
 * Delegates to Jetpack Compose `LazyColumn.Items`, which recycles rows unless `recycling` is `false`.
 */
export const ListForEach = createLazyItems('List.ForEach');
