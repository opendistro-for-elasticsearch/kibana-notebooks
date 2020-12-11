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
import com.amazon.opendistroforelasticsearch.notebooks.NotebooksPlugin.Companion.LOG_PREFIX
import com.amazon.opendistroforelasticsearch.notebooks.index.NotebooksIndex
import com.amazon.opendistroforelasticsearch.notebooks.model.CreateNotebookRequest
import com.amazon.opendistroforelasticsearch.notebooks.model.CreateNotebookResponse
import com.amazon.opendistroforelasticsearch.notebooks.model.DeleteNotebookRequest
import com.amazon.opendistroforelasticsearch.notebooks.model.DeleteNotebookResponse
import com.amazon.opendistroforelasticsearch.notebooks.model.GetAllNotebooksRequest
import com.amazon.opendistroforelasticsearch.notebooks.model.GetAllNotebooksResponse
import com.amazon.opendistroforelasticsearch.notebooks.model.GetNotebookRequest
import com.amazon.opendistroforelasticsearch.notebooks.model.GetNotebookResponse
import com.amazon.opendistroforelasticsearch.notebooks.model.ReportDefinitionDetails
import com.amazon.opendistroforelasticsearch.notebooks.model.UpdateNotebookRequest
import com.amazon.opendistroforelasticsearch.notebooks.model.UpdateNotebookResponse
import com.amazon.opendistroforelasticsearch.notebooks.security.UserAccessManager
import com.amazon.opendistroforelasticsearch.notebooks.util.logger
import org.elasticsearch.ElasticsearchStatusException
import org.elasticsearch.rest.RestStatus
import java.time.Instant

/**
 * Report definitions index operation actions.
 */
internal object NotebookActions {
    private val log by logger(NotebookActions::class.java)

    /**
     * Create new ReportDefinition
     * @param request [CreateNotebookRequest] object
     * @return [CreateNotebookResponse]
     */
    fun create(request: CreateNotebookRequest, user: User?): CreateNotebookResponse {
        log.info("$LOG_PREFIX:ReportDefinition-create")
        UserAccessManager.validateUser(user)
        val currentTime = Instant.now()
        val reportDefinitionDetails = ReportDefinitionDetails("ignore",
            currentTime,
            currentTime,
            UserAccessManager.getUserTenant(user),
            UserAccessManager.getAllAccessInfo(user),
            request.reportDefinition
        )
        val docId = NotebooksIndex.createReportDefinition(reportDefinitionDetails)
        docId ?: throw ElasticsearchStatusException("Report Definition Creation failed",
            RestStatus.INTERNAL_SERVER_ERROR)
        return CreateNotebookResponse(docId)
    }

    /**
     * Update ReportDefinition
     * @param request [UpdateNotebookRequest] object
     * @return [UpdateNotebookResponse]
     */
    fun update(request: UpdateNotebookRequest, user: User?): UpdateNotebookResponse {
        log.info("$LOG_PREFIX:ReportDefinition-update ${request.reportDefinitionId}")
        UserAccessManager.validateUser(user)
        val currentReportDefinitionDetails = NotebooksIndex.getReportDefinition(request.reportDefinitionId)
        currentReportDefinitionDetails
            ?: throw ElasticsearchStatusException("Report Definition ${request.reportDefinitionId} not found", RestStatus.NOT_FOUND)
        if (!UserAccessManager.doesUserHasAccess(user, currentReportDefinitionDetails.tenant, currentReportDefinitionDetails.access)) {
            throw ElasticsearchStatusException("Permission denied for Report Definition ${request.reportDefinitionId}", RestStatus.FORBIDDEN)
        }
        val currentTime = Instant.now()
        val reportDefinitionDetails = ReportDefinitionDetails(request.reportDefinitionId,
            currentTime,
            currentReportDefinitionDetails.createdTime,
            UserAccessManager.getUserTenant(user),
            currentReportDefinitionDetails.access,
            request.reportDefinition
        )
        if (!NotebooksIndex.updateReportDefinition(request.reportDefinitionId, reportDefinitionDetails)) {
            throw ElasticsearchStatusException("Report Definition Update failed", RestStatus.INTERNAL_SERVER_ERROR)
        }
        return UpdateNotebookResponse(request.reportDefinitionId)
    }

    /**
     * Get ReportDefinition info
     * @param request [GetNotebookRequest] object
     * @return [GetNotebookResponse]
     */
    fun info(request: GetNotebookRequest, user: User?): GetNotebookResponse {
        log.info("$LOG_PREFIX:ReportDefinition-info ${request.reportDefinitionId}")
        UserAccessManager.validateUser(user)
        val reportDefinitionDetails = NotebooksIndex.getReportDefinition(request.reportDefinitionId)
        reportDefinitionDetails
            ?: throw ElasticsearchStatusException("Report Definition ${request.reportDefinitionId} not found", RestStatus.NOT_FOUND)
        if (!UserAccessManager.doesUserHasAccess(user, reportDefinitionDetails.tenant, reportDefinitionDetails.access)) {
            throw ElasticsearchStatusException("Permission denied for Report Definition ${request.reportDefinitionId}", RestStatus.FORBIDDEN)
        }
        return GetNotebookResponse(reportDefinitionDetails, UserAccessManager.hasAllInfoAccess(user))
    }

    /**
     * Delete ReportDefinition
     * @param request [DeleteNotebookRequest] object
     * @return [DeleteNotebookResponse]
     */
    fun delete(request: DeleteNotebookRequest, user: User?): DeleteNotebookResponse {
        log.info("$LOG_PREFIX:ReportDefinition-delete ${request.reportDefinitionId}")
        UserAccessManager.validateUser(user)
        val reportDefinitionDetails = NotebooksIndex.getReportDefinition(request.reportDefinitionId)
        reportDefinitionDetails
            ?: throw ElasticsearchStatusException("Report Definition ${request.reportDefinitionId} not found", RestStatus.NOT_FOUND)
        if (!UserAccessManager.doesUserHasAccess(user, reportDefinitionDetails.tenant, reportDefinitionDetails.access)) {
            throw ElasticsearchStatusException("Permission denied for Report Definition ${request.reportDefinitionId}", RestStatus.FORBIDDEN)
        }
        if (!NotebooksIndex.deleteReportDefinition(request.reportDefinitionId)) {
            throw ElasticsearchStatusException("Report Definition ${request.reportDefinitionId} delete failed", RestStatus.REQUEST_TIMEOUT)
        }
        return DeleteNotebookResponse(request.reportDefinitionId)
    }

    /**
     * Get all ReportDefinitions
     * @param request [GetAllNotebooksRequest] object
     * @return [GetAllNotebooksResponse]
     */
    fun getAll(request: GetAllNotebooksRequest, user: User?): GetAllNotebooksResponse {
        log.info("$LOG_PREFIX:ReportDefinition-getAll fromIndex:${request.fromIndex} maxItems:${request.maxItems}")
        UserAccessManager.validateUser(user)
        val reportDefinitionsList = NotebooksIndex.getAllReportDefinitions(UserAccessManager.getUserTenant(user),
            UserAccessManager.getSearchAccessInfo(user),
            request.fromIndex,
            request.maxItems)
        return GetAllNotebooksResponse(reportDefinitionsList, UserAccessManager.hasAllInfoAccess(user))
    }
}
