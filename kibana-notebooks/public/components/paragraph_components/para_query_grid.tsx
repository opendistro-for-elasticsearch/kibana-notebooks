/*
 * Copyright 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
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
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { EuiDataGrid, EuiText } from '@elastic/eui';

type QueryDataGridProps = {
  rowCount: number,
  queryColumns: Array<any>,
  visibleColumns: Array<any>,
  setVisibleColumns: Function,
  dataValues: Array<any>
}

export function QueryDataGrid(props: QueryDataGridProps) {
  const {
    rowCount,
    queryColumns,
    visibleColumns,
    setVisibleColumns,
    dataValues
  } = props;
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  // ** Sorting config
  const [sortingColumns, setSortingColumns] = useState([]);
  
  const onSort = useCallback(
    (sortingColumns) => {
      setSortingColumns(sortingColumns);
    },
    [setSortingColumns]
  );

  const onChangeItemsPerPage = useCallback(
    (pageSize) =>
      setPagination((pagination) => ({
        ...pagination,
        pageSize,
        pageIndex: 0,
      })),
    [setPagination]
  );

  const onChangePage = useCallback(
    (pageIndex) =>
      setPagination((pagination) => ({ ...pagination, pageIndex })),
    [setPagination]
  );

  const renderCellValue = useMemo(() => {
    return ({ rowIndex, columnId }) => {
      // Because inMemory is not set for pagination, we need to manage it
      // The row index must be adjusted as `data` has already been pruned to the page size
      const adjustedRowIndex =
        rowIndex - pagination.pageIndex * pagination.pageSize;

      return dataValues.hasOwnProperty(adjustedRowIndex)
        ? dataValues[adjustedRowIndex][columnId]
        : null;
    };
  }, [dataValues, pagination.pageIndex, pagination.pageSize]);

  return (
    <div>
      <EuiDataGrid
        aria-label='Query datagrid'
        columns={queryColumns}
        columnVisibility={{ visibleColumns, setVisibleColumns }}
        rowCount={rowCount}
        renderCellValue={renderCellValue}
        inMemory={{ level: 'enhancements' }}
        sorting={{ columns: sortingColumns, onSort }}
        pagination={{
          ...pagination,
          pageSizeOptions: [10, 50, 100],
          onChangeItemsPerPage: onChangeItemsPerPage,
          onChangePage: onChangePage,
        }}
      />
    </div>
  )
}