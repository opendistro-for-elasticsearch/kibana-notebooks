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

package com.amazon.opendistroforelasticsearch.notebooks.model

import com.amazon.opendistroforelasticsearch.notebooks.NotebooksPlugin.Companion.LOG_PREFIX
import com.amazon.opendistroforelasticsearch.notebooks.util.logger
// import com.amazon.opendistroforelasticsearch.notebooks.util.stringList
import org.elasticsearch.common.xcontent.ToXContent
import org.elasticsearch.common.xcontent.ToXContentObject
import org.elasticsearch.common.xcontent.XContentBuilder
import org.elasticsearch.common.xcontent.XContentFactory
import org.elasticsearch.common.xcontent.XContentParser
import org.elasticsearch.common.xcontent.XContentParserUtils
// import java.time.Duration

/**
 * Report definition main data class.
 * <pre> JSON format
 * {@code
 * {
 *   "name":"name",
 *   "isEnabled":true,
 *   "source":{
 *      "description":"description",
 *      "type":"Dashboard", // Dashboard, Visualization, SavedSearch
 *      "origin":"http://localhost:5601",
 *      "id":"id"
 *   },
 *   "format":{
 *       "duration":"PT1H",
 *       "fileFormat":"Pdf", // Pdf, Png, Csv
 *       "limit":1000, // optional
 *       "header":"optional header",
 *       "footer":"optional footer"
 *   },
 *   "trigger":{
 *       "triggerType":"OnDemand", // Download, OnDemand, CronSchedule, IntervalSchedule
 *       "schedule":{ // required when triggerType is CronSchedule or IntervalSchedule
 *           "cron":{ // required when triggerType is CronSchedule
 *               "expression":"0 * * * *",
 *               "timezone":"PST"
 *           },
 *           "interval":{ // required when triggerType is IntervalSchedule
 *               "start_time":1603506908773,
 *               "period":10",
 *               "unit":"Minutes"
 *           }
 *       }
 *   },
 *   "delivery":{ // optional
 *       "recipients":["banantha@amazon.com"],
 *       "deliveryFormat":"LinkOnly", // LinkOnly, Attachment, Embedded
 *       "title":"title",
 *       "textDescription":"textDescription",
 *       "htmlDescription":"optional htmlDescription",
 *       "channelIds":["optional_channelIds"]
 *   }
 * }
 * }</pre>
 */

internal data class Notebook(
    val name: String,
    val backend: String,
    val paragraphs: List<Paragraph>
) : ToXContentObject {

    internal enum class SourceType { Dashboard, Visualization, SavedSearch }
    internal enum class TriggerType { Download, OnDemand, CronSchedule, IntervalSchedule }
    internal enum class DeliveryFormat { LinkOnly, Attachment, Embedded }
    internal enum class FileFormat { Pdf, Png, Csv }

    internal companion object {
        private val log by logger(Notebook::class.java)
        private const val NAME_TAG = "name"
        private const val BACKEND_TAG = "backend"
        private const val PARAGRAPHS_TAG = "paragraphs"

        /**
         * Parse the data from parser and create Notebook object
         * @param parser data referenced at parser
         * @return created Notebook object
         */
        fun parse(parser: XContentParser): Notebook {
            var name: String? = null
            var backend: String? = null
            var paragraphs: List<Paragraph>? = null
            XContentParserUtils.ensureExpectedToken(XContentParser.Token.START_OBJECT, parser.currentToken(), parser)
            while (XContentParser.Token.END_OBJECT != parser.nextToken()) {
                val fieldName = parser.currentName()
                parser.nextToken()
                when (fieldName) {
                    NAME_TAG -> name = parser.text()
                    BACKEND_TAG -> backend = parser.text()
                    PARAGRAPHS_TAG -> paragraphs = Paragraph.parse(parser)
                    else -> {
                        parser.skipChildren()
                        log.info("$LOG_PREFIX:Notebook Skipping Unknown field $fieldName")
                    }
                }
                println("paragraphs $paragraphs")
            }
            name ?: throw IllegalArgumentException("$NAME_TAG field absent")
            backend ?: throw IllegalArgumentException("$BACKEND_TAG field absent")
            paragraphs ?: throw IllegalArgumentException("$PARAGRAPHS_TAG field absent")
            return Notebook(
                name,
                backend,
                paragraphs
            )
        }
    }

    /**
     * create XContentBuilder from this object using [XContentFactory.jsonBuilder()]
     * @param params XContent parameters
     * @return created XContentBuilder object
     */
    fun toXContent(params: ToXContent.Params = ToXContent.EMPTY_PARAMS): XContentBuilder? {
        return toXContent(XContentFactory.jsonBuilder(), params)
    }

    /**
     * {@inheritDoc}
     */
    override fun toXContent(builder: XContentBuilder?, params: ToXContent.Params?): XContentBuilder {
        builder!!
        builder.startObject()
            .field(NAME_TAG, name)
            .field(BACKEND_TAG, backend)
//        builder.field(PARAGRAPHS_TAG)
//        paragraphs.toXContent(builder, ToXContent.EMPTY_PARAMS)
        builder.endObject()
        return builder
    }

    /**
     * Report definition source data class
     */
    internal data class Paragraph(
        val output: String
    ) : ToXContentObject {
        internal companion object {
            private const val OUTPUT_TAG = "output"

            /**
             * Parse the item list from parser
             * @param parser data referenced at parser
             * @return created list of items
             */
            private fun parseItemList(parser: XContentParser): List<ItemClass> {
                val retList: MutableList<ItemClass> = mutableListOf()
                XContentParserUtils.ensureExpectedToken(XContentParser.Token.START_ARRAY, parser.currentToken(), parser)
                while (parser.nextToken() != XContentParser.Token.END_ARRAY) {
                    retList.add(parseItem(parser))
                }
                return retList
            }

            /**
             * Parse the data from parser and create Source object
             * @param parser data referenced at parser
             * @return created Source object
             */
            fun parse(parser: XContentParser): List<Paragraph> {
                var output: String? = null
                XContentParserUtils.ensureExpectedToken(
                    XContentParser.Token.START_OBJECT,
                    parser.currentToken(),
                    parser
                )
                while (XContentParser.Token.END_OBJECT != parser.nextToken()) {
                    val fieldName = parser.currentName()
                    parser.nextToken()
                    when (fieldName) {
                        OUTPUT_TAG -> output = parser.text()
                        else -> {
                            parser.skipChildren()
                            log.info("$LOG_PREFIX:Source Skipping Unknown field $fieldName")
                        }
                    }
                }
                output ?: throw IllegalArgumentException("$OUTPUT_TAG field absent")
                return Paragraph(
                    output
                )
            }
        }

        /**
         * {@inheritDoc}
         */
        override fun toXContent(builder: XContentBuilder?, params: ToXContent.Params?): XContentBuilder {
            builder!!
            builder.startObject()
                .field(OUTPUT_TAG, output)
                .endObject()
            return builder
        }
    }
//
//    /**
//     * Report definition format data class
//     */
//    internal data class Format(
//        val duration: Duration,
//        val fileFormat: FileFormat,
//        val limit: Int?,
//        val header: String?,
//        val footer: String?
//    ) : ToXContentObject {
//        internal companion object {
//            private const val DURATION_TAG = "duration"
//            private const val FILE_FORMAT_TAG = "fileFormat"
//            private const val LIMIT_TAG = "limit"
//            private const val HEADER_TAG = "header"
//            private const val FOOTER_TAG = "footer"
//
//            /**
//             * Parse the data from parser and create Format object
//             * @param parser data referenced at parser
//             * @return created Format object
//             */
//            fun parse(parser: XContentParser): Format {
//                var durationSeconds: Duration? = null
//                var fileFormat: FileFormat? = null
//                var limit: Int? = null
//                var header: String? = null
//                var footer: String? = null
//                XContentParserUtils.ensureExpectedToken(XContentParser.Token.START_OBJECT, parser.currentToken(), parser)
//                while (XContentParser.Token.END_OBJECT != parser.nextToken()) {
//                    val fieldName = parser.currentName()
//                    parser.nextToken()
//                    when (fieldName) {
//                        DURATION_TAG -> durationSeconds = Duration.parse(parser.text())
//                        FILE_FORMAT_TAG -> fileFormat = FileFormat.valueOf(parser.text())
//                        LIMIT_TAG -> limit = parser.intValue()
//                        HEADER_TAG -> header = parser.textOrNull()
//                        FOOTER_TAG -> footer = parser.textOrNull()
//                        else -> {
//                            parser.skipChildren()
//                            log.info("$LOG_PREFIX:Format Skipping Unknown field $fieldName")
//                        }
//                    }
//                }
//                durationSeconds
//                    ?: throw IllegalArgumentException("$DURATION_TAG field absent")
//                fileFormat ?: throw IllegalArgumentException("$FILE_FORMAT_TAG field absent")
//                return Format(durationSeconds,
//                    fileFormat,
//                    limit,
//                    header,
//                    footer)
//            }
//        }
//
//        /**
//         * {@inheritDoc}
//         */
//        override fun toXContent(builder: XContentBuilder?, params: ToXContent.Params?): XContentBuilder {
//            builder!!
//            builder.startObject()
//                .field(DURATION_TAG, duration.toString())
//                .field(FILE_FORMAT_TAG, fileFormat.name)
//            if (limit != null) builder.field(LIMIT_TAG, limit)
//            if (header != null) builder.field(HEADER_TAG, header)
//            if (footer != null) builder.field(FOOTER_TAG, footer)
//            builder.endObject()
//            return builder
//        }
//    }
//
//    /**
//     * Report definition trigger data class
//     */
//    internal data class Trigger(
//        val triggerType: TriggerType,
//        val schedule: Any?
//    ) : ToXContentObject {
//        internal companion object {
//            private const val TRIGGER_TYPE_TAG = "triggerType"
//            private const val SCHEDULE_TAG = "schedule"
//
//            /**
//             * Parse the data from parser and create Trigger object
//             * @param parser data referenced at parser
//             * @return created Trigger object
//             */
//            fun parse(parser: XContentParser): Trigger {
//                var triggerType: TriggerType? = null
//                var schedule: Any? = null
//                XContentParserUtils.ensureExpectedToken(XContentParser.Token.START_OBJECT, parser.currentToken(), parser)
//                while (XContentParser.Token.END_OBJECT != parser.nextToken()) {
//                    val fieldName = parser.currentName()
//                    parser.nextToken()
//                    when (fieldName) {
//                        TRIGGER_TYPE_TAG -> triggerType = TriggerType.valueOf(parser.text())
//                        SCHEDULE_TAG -> schedule = ScheduleParser.parse(parser)
//                        else -> log.info("$LOG_PREFIX: Trigger Skipping Unknown field $fieldName")
//                    }
//                }
//                triggerType ?: throw IllegalArgumentException("$TRIGGER_TYPE_TAG field absent")
//                if (isScheduleType(triggerType)) {
//                    schedule ?: throw IllegalArgumentException("$SCHEDULE_TAG field absent")
//                }
//                return Trigger(triggerType, schedule)
//            }
//
//            fun isScheduleType(triggerType: TriggerType): Boolean {
//                return (triggerType == TriggerType.CronSchedule || triggerType == TriggerType.IntervalSchedule)
//            }
//        }
//
//        /**
//         * {@inheritDoc}
//         */
//        override fun toXContent(builder: XContentBuilder?, params: ToXContent.Params?): XContentBuilder {
//            builder!!
//            builder.startObject()
//                .field(TRIGGER_TYPE_TAG, triggerType)
//            if (isScheduleType(triggerType)) {
//                builder.field(SCHEDULE_TAG)
//                schedule!!.toXContent(builder, ToXContent.EMPTY_PARAMS)
//            }
//            builder.endObject()
//            return builder
//        }
//    }
//
//    /**
//     * Report definition delivery data class
//     */
//    internal data class Delivery(
//        val recipients: List<String>,
//        val deliveryFormat: DeliveryFormat,
//        val title: String,
//        val textDescription: String,
//        val htmlDescription: String?,
//        val channelIds: List<String>
//    ) : ToXContentObject {
//        internal companion object {
//            private const val RECIPIENTS_TAG = "recipients"
//            private const val DELIVERY_FORMAT_TAG = "deliveryFormat"
//            private const val TITLE_TAG = "title"
//            private const val TEXT_DESCRIPTION_TAG = "textDescription"
//            private const val HTML_DESCRIPTION_TAG = "htmlDescription"
//            private const val CHANNEL_IDS_TAG = "channelIds"
//
//            /**
//             * Parse the data from parser and create Delivery object
//             * @param parser data referenced at parser
//             * @return created Delivery object
//             */
//            fun parse(parser: XContentParser): Delivery {
//                var recipients: List<String> = listOf()
//                var deliveryFormat: DeliveryFormat? = null
//                var title: String? = null
//                var textDescription: String? = null
//                var htmlDescription: String? = null
//                var channelIds: List<String> = listOf()
//                XContentParserUtils.ensureExpectedToken(XContentParser.Token.START_OBJECT, parser.currentToken(), parser)
//                while (XContentParser.Token.END_OBJECT != parser.nextToken()) {
//                    val fieldName = parser.currentName()
//                    parser.nextToken()
//                    when (fieldName) {
//                        RECIPIENTS_TAG -> recipients = parser.stringList()
//                        DELIVERY_FORMAT_TAG -> deliveryFormat = DeliveryFormat.valueOf(parser.text())
//                        TITLE_TAG -> title = parser.text()
//                        TEXT_DESCRIPTION_TAG -> textDescription = parser.text()
//                        HTML_DESCRIPTION_TAG -> htmlDescription = parser.textOrNull()
//                        CHANNEL_IDS_TAG -> channelIds = parser.stringList()
//                        else -> log.info("$LOG_PREFIX: Delivery Unknown field $fieldName")
//                    }
//                }
//                deliveryFormat ?: throw IllegalArgumentException("$DELIVERY_FORMAT_TAG field absent")
//                title ?: throw IllegalArgumentException("$TITLE_TAG field absent")
//                textDescription ?: throw IllegalArgumentException("$TEXT_DESCRIPTION_TAG field absent")
//                return Delivery(recipients,
//                    deliveryFormat,
//                    title,
//                    textDescription,
//                    htmlDescription,
//                    channelIds)
//            }
//        }
//
//        /**
//         * {@inheritDoc}
//         */
//        override fun toXContent(builder: XContentBuilder?, params: ToXContent.Params?): XContentBuilder {
//            builder!!
//            builder.startObject()
//                .field(RECIPIENTS_TAG, recipients)
//                .field(DELIVERY_FORMAT_TAG, deliveryFormat)
//                .field(TITLE_TAG, title)
//                .field(TEXT_DESCRIPTION_TAG, textDescription)
//            if (htmlDescription != null) {
//                builder.field(HTML_DESCRIPTION_TAG, htmlDescription)
//            }
//            builder.field(CHANNEL_IDS_TAG, channelIds)
//            builder.endObject()
//            return builder
//        }
//    }
}
