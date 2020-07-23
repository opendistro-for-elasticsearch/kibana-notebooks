import {
  PluginInitializerContext,
  CoreSetup,
  CoreStart,
  Plugin,
  Logger,
} from '../../../src/core/server';

import { KibanaNotebooksPluginSetup, KibanaNotebooksPluginStart } from './types';
import { defineRoutes } from './routes';

export class KibanaNotebooksPlugin
  implements Plugin<KibanaNotebooksPluginSetup, KibanaNotebooksPluginStart> {
  private readonly logger: Logger;

  constructor(initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
  }

  public setup(core: CoreSetup) {
    this.logger.debug('kibana_notebooks: Setup');
    const router = core.http.createRouter();

    // Register server side APIs
    defineRoutes(router);

    return {};
  }

  public start(core: CoreStart) {
    this.logger.debug('kibana_notebooks: Started');
    return {};
  }

  public stop() {}
}
