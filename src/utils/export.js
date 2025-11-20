/**
 * Excel 导出工具函数
 * 使用 xlsx 库实现 Excel 文件导出
 */
import * as XLSX from 'xlsx'
/**
 * 导出表格数据为 Excel
 * @param {Array} data - 表格数据数组
 * @param {Array} columns - 列配置 [{ prop: 'name', label: '姓名', width: 20 }]
 * @param {String} filename - 文件名（不含扩展名）
 * @param {Object} options - 可选配置
 */
export function exportToExcel(data, columns, filename = '导出数据', options = {}) {
  if (!data || data.length === 0) {
    throw new Error('没有可导出的数据')
  }

  // 1. 数据转换：将对象数组转为二维数组
  const headers = columns.map(col => col.label)
  const rows = data.map(row => 
    columns.map(col => {
      let value = row[col.prop]
      
      // 处理格式化函数
      if (col.formatter && typeof col.formatter === 'function') {
        value = col.formatter(value)
      }
      
      return value ?? ''
    })
  )
  
  // 2. 创建工作表
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows])
  
  // 3. 设置列宽
  const colWidths = columns.map(col => ({
    wch: col.width || 15 // 默认宽度15字符
  }))
  worksheet['!cols'] = colWidths
  
  // 4. 创建工作簿
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, options.sheetName || 'Sheet1')
  
  // 5. 导出文件
  const timestamp = new Date().toISOString().split('T')[0]
  XLSX.writeFile(workbook, `${filename}_${timestamp}.xlsx`)
}

/**
 * 导出简单表格数据（自动提取列配置）
 * @param {Array} tableData - 表格数据
 * @param {String} filename - 文件名
 */
export function exportTableData(tableData, filename) {
  if (!tableData || tableData.length === 0) {
    throw new Error('没有可导出的数据')
  }
  
  // 自动提取列配置
  const firstRow = tableData[0]
  const columns = Object.keys(firstRow).map(key => ({
    prop: key,
    label: key
  }))
  
  exportToExcel(tableData, columns, filename)
}

/**
 * 导出多个 Sheet
 * @param {Array} sheets - Sheet 配置数组 [{ name: 'Sheet1', data: [...], columns: [...] }]
 * @param {String} filename - 文件名
 */
export function exportMultiSheet(sheets, filename) {
  const workbook = XLSX.utils.book_new()
  
  sheets.forEach(sheet => {
    // 如果提供了列配置，使用 aoa_to_sheet 方式处理
    if (sheet.columns && sheet.columns.length > 0) {
      // 1. 提取表头
      const headers = sheet.columns.map(col => col.label)
      
      // 2. 转换数据为二维数组
      const rows = sheet.data.map(row => 
        sheet.columns.map(col => {
          let value = row[col.prop]
          
          // 处理格式化函数
          if (col.formatter && typeof col.formatter === 'function') {
            value = col.formatter(value)
          }
          
          return value ?? ''
        })
      )
      
      // 3. 创建工作表
      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
      
      // 4. 设置列宽
      const colWidths = sheet.columns.map(col => ({
        wch: col.width || 15
      }))
      ws['!cols'] = colWidths
      
      XLSX.utils.book_append_sheet(workbook, ws, sheet.name)
    } else {
      // 如果没有列配置，使用默认方式
      const ws = XLSX.utils.json_to_sheet(sheet.data)
      XLSX.utils.book_append_sheet(workbook, ws, sheet.name)
    }
  })
  
  const timestamp = new Date().toISOString().split('T')[0]
  XLSX.writeFile(workbook, `${filename}_${timestamp}.xlsx`)
}
