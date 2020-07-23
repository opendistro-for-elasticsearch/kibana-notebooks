import { NavigationPublicPluginStart } from '../../../src/plugins/navigation/public';

export interface KibanaNotebooksPluginSetup {
  getGreeting: () => string;
}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface KibanaNotebooksPluginStart {}

export interface AppPluginStartDependencies {
  navigation: NavigationPublicPluginStart;
}
