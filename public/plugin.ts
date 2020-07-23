import { i18n } from '@kbn/i18n';
import { AppMountParameters, CoreSetup, CoreStart, Plugin } from '../../../src/core/public';
import {
  KibanaNotebooksPluginSetup,
  KibanaNotebooksPluginStart,
  AppPluginStartDependencies,
} from './types';
import { PLUGIN_NAME } from '../common';

export class KibanaNotebooksPlugin
  implements Plugin<KibanaNotebooksPluginSetup, KibanaNotebooksPluginStart> {
  public setup(core: CoreSetup): KibanaNotebooksPluginSetup {
    // Register an application into the side navigation menu
    core.application.register({
      id: 'kibanaNotebooks',
      title: PLUGIN_NAME,
      async mount(params: AppMountParameters) {
        // Load application bundle
        const { renderApp } = await import('./application');
        // Get start services as specified in kibana.json
        const [coreStart, depsStart] = await core.getStartServices();
        // Render the application
        return renderApp(coreStart, depsStart as AppPluginStartDependencies, params);
      },
    });

    // Return methods that should be available to other plugins
    return {
      getGreeting() {
        return i18n.translate('kibanaNotebooks.greetingText', {
          defaultMessage: 'Hello from {name}!',
          values: {
            name: PLUGIN_NAME,
          },
        });
      },
    };
  }

  public start(core: CoreStart): KibanaNotebooksPluginStart {
    return {};
  }

  public stop() {}
}
