import { createLazyItems } from '../../jetpack-compose/LazyItems';

/**
 * Android implementation of `List.ForEach`. Delegates to Jetpack Compose `LazyColumn.Items`.
 */
export const ListForEach = createLazyItems('List.ForEach');
