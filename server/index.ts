import { PluginInitializerContext } from '../../../src/core/server';
import { KibanaNotebooksPlugin } from './plugin';

//  This exports static code and TypeScript types,
//  as well as, Kibana Platform `plugin()` initializer.

export function plugin(initializerContext: PluginInitializerContext) {
  return new KibanaNotebooksPlugin(initializerContext);
}

export { KibanaNotebooksPluginSetup, KibanaNotebooksPluginStart } from './types';
