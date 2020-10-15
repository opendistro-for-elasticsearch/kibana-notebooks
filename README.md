# Open Distro for Elasticsearch Kibana Notebooks

Dashboards offer a solution for a few selected use cases, and are a great tool if you’re focused on monitoring a known set of metrics over time. Notebooks enables contextual use of data with detailed explanations by allowing a user to combine saved visualizations, text, graphs and decorate data in elastic with other reference data sources.

## Documentation

Please see our technical [documentation](https://opendistro.github.io/for-elasticsearch-docs/) to learn more about its features.

## Setup

1. Download Elasticsearch for the version that matches the [Kibana version specified in package.json](./package.json#L7).
1. Download the Kibana source code for the [version specified in package.json](./package.json#L7) you want to set up.

   See the [Kibana contributing guide](https://github.com/elastic/kibana/blob/master/CONTRIBUTING.md#setting-up-your-development-environment) for more instructions on setting up your development environment.

1. Change your node version to the version specified in `.node-version` inside the Kibana root directory.
1. cd into `plugins` directory in the Kibana source code directory.
1. Check out this package from version control into the `plugins` directory.
1. Run `yarn kbn bootstrap` inside `kibana/plugins/kibana-notebooks`.

Ultimately, your directory structure should look like this:

```md
.
├── kibana
│   └── plugins
│       └── kibana-notebooks
```

## Build

To build the plugin's distributable zip simply run `yarn build`.

Example output: `./build/kibana_notebooks-*.zip`


## Run

- `yarn start`

  Starts Kibana and includes this plugin. Kibana will be available on `localhost:5601`.

- `yarn test`

  Runs the plugin cypress tests.

## License

The contents of this repo are licensed under the Apache 2.0 License.
