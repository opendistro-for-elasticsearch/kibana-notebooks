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

package com.amazon.opendistroforelasticsearch.notebooks.action

import com.amazon.opendistroforelasticsearch.commons.authuser.User
import com.amazon.opendistroforelasticsearch.notebooks.model.CreateReportDefinitionRequest
import com.amazon.opendistroforelasticsearch.notebooks.model.CreateReportDefinitionResponse
import org.elasticsearch.action.ActionType
import org.elasticsearch.action.support.ActionFilters
import org.elasticsearch.client.Client
import org.elasticsearch.common.inject.Inject
import org.elasticsearch.common.xcontent.NamedXContentRegistry
import org.elasticsearch.transport.TransportService

/**
 * Create reportDefinition transport action
 */
internal class CreateReportDefinitionAction @Inject constructor(
    transportService: TransportService,
    client: Client,
    actionFilters: ActionFilters,
    val xContentRegistry: NamedXContentRegistry
) : PluginBaseAction<CreateReportDefinitionRequest, CreateReportDefinitionResponse>(NAME,
    transportService,
    client,
    actionFilters,
    ::CreateReportDefinitionRequest) {
    companion object {
        private const val NAME = "cluster:admin/opendistro/notebooks/create"
        internal val ACTION_TYPE = ActionType(NAME, ::CreateReportDefinitionResponse)
    }

    /**
     * {@inheritDoc}
     */
    override fun executeRequest(request: CreateReportDefinitionRequest, user: User?): CreateReportDefinitionResponse {
        return ReportDefinitionActions.create(request, user)
    }
}
