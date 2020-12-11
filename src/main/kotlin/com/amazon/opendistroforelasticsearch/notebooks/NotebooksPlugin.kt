/*
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * A copy of the License is located at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 *
 */
package com.amazon.opendistroforelasticsearch.notebooks

import com.amazon.opendistroforelasticsearch.notebooks.action.CreateReportDefinitionAction
import com.amazon.opendistroforelasticsearch.notebooks.action.DeleteReportDefinitionAction
import com.amazon.opendistroforelasticsearch.notebooks.action.GetAllReportDefinitionsAction
import com.amazon.opendistroforelasticsearch.notebooks.action.GetReportDefinitionAction
import com.amazon.opendistroforelasticsearch.notebooks.action.UpdateReportDefinitionAction
import com.amazon.opendistroforelasticsearch.notebooks.index.ReportDefinitionsIndex
import com.amazon.opendistroforelasticsearch.notebooks.resthandler.ReportDefinitionListRestHandler
import com.amazon.opendistroforelasticsearch.notebooks.resthandler.ReportDefinitionRestHandler
import com.amazon.opendistroforelasticsearch.notebooks.settings.PluginSettings
import org.elasticsearch.action.ActionRequest
import org.elasticsearch.action.ActionResponse
import org.elasticsearch.client.Client
import org.elasticsearch.cluster.metadata.IndexNameExpressionResolver
import org.elasticsearch.cluster.node.DiscoveryNodes
import org.elasticsearch.cluster.service.ClusterService
import org.elasticsearch.common.io.stream.NamedWriteableRegistry
import org.elasticsearch.common.settings.ClusterSettings
import org.elasticsearch.common.settings.IndexScopedSettings
import org.elasticsearch.common.settings.Setting
import org.elasticsearch.common.settings.Settings
import org.elasticsearch.common.settings.SettingsFilter
import org.elasticsearch.common.xcontent.NamedXContentRegistry
import org.elasticsearch.env.Environment
import org.elasticsearch.env.NodeEnvironment
import org.elasticsearch.plugins.ActionPlugin
import org.elasticsearch.plugins.Plugin
import org.elasticsearch.repositories.RepositoriesService
import org.elasticsearch.rest.RestController
import org.elasticsearch.rest.RestHandler
import org.elasticsearch.script.ScriptService
import org.elasticsearch.threadpool.ThreadPool
import org.elasticsearch.watcher.ResourceWatcherService
import java.util.function.Supplier

/**
 * Entry point of the OpenDistro for Elasticsearch Reports scheduler plugin.
 * This class initializes the rest handlers.
 */
class NotebooksPlugin : Plugin(), ActionPlugin {

    companion object {
        const val PLUGIN_NAME = "opendistro-notebooks"
        const val LOG_PREFIX = "notebooks"
        const val BASE_REPORTS_URI = "/_opendistro/_notebooks"
    }

    /**
     * {@inheritDoc}
     */
    override fun getSettings(): List<Setting<*>> {
        return PluginSettings.getAllSettings()
    }

    /**
     * {@inheritDoc}
     */
    override fun createComponents(
        client: Client,
        clusterService: ClusterService,
        threadPool: ThreadPool,
        resourceWatcherService: ResourceWatcherService,
        scriptService: ScriptService,
        xContentRegistry: NamedXContentRegistry,
        environment: Environment,
        nodeEnvironment: NodeEnvironment,
        namedWriteableRegistry: NamedWriteableRegistry,
        indexNameExpressionResolver: IndexNameExpressionResolver,
        repositoriesServiceSupplier: Supplier<RepositoriesService>
    ): Collection<Any> {
        PluginSettings.addSettingsUpdateConsumer(clusterService)
        ReportDefinitionsIndex.initialize(client, clusterService)
        return emptyList()
    }

    /**
     * {@inheritDoc}
     */
    override fun getRestHandlers(
        settings: Settings,
        restController: RestController,
        clusterSettings: ClusterSettings,
        indexScopedSettings: IndexScopedSettings,
        settingsFilter: SettingsFilter,
        indexNameExpressionResolver: IndexNameExpressionResolver,
        nodesInCluster: Supplier<DiscoveryNodes>
    ): List<RestHandler> {
        return listOf(
            ReportDefinitionRestHandler(),
            ReportDefinitionListRestHandler()
        )
    }

    /**
     * {@inheritDoc}
     */
    override fun getActions(): List<ActionPlugin.ActionHandler<out ActionRequest, out ActionResponse>> {
        return listOf(
            ActionPlugin.ActionHandler(CreateReportDefinitionAction.ACTION_TYPE, CreateReportDefinitionAction::class.java),
            ActionPlugin.ActionHandler(DeleteReportDefinitionAction.ACTION_TYPE, DeleteReportDefinitionAction::class.java),
            ActionPlugin.ActionHandler(GetAllReportDefinitionsAction.ACTION_TYPE, GetAllReportDefinitionsAction::class.java),
            ActionPlugin.ActionHandler(GetReportDefinitionAction.ACTION_TYPE, GetReportDefinitionAction::class.java),
            ActionPlugin.ActionHandler(UpdateReportDefinitionAction.ACTION_TYPE, UpdateReportDefinitionAction::class.java)
        )
    }
}
