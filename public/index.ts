import './index.scss';

import { KibanaNotebooksPlugin } from './plugin';

// This exports static code and TypeScript types,
// as well as, Kibana Platform `plugin()` initializer.
export function plugin() {
  return new KibanaNotebooksPlugin();
}
export { KibanaNotebooksPluginSetup, KibanaNotebooksPluginStart } from './types';
