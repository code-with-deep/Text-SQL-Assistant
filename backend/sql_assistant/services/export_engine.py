import csv
import logging
from io import StringIO, BytesIO
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

logger = logging.getLogger('sql_assistant')


class ExportEngine:

    def export_csv(self, columns, rows):
        """
        Exports the result set as a CSV string (UTF-8).
        """
        try:
            output = StringIO()
            writer = csv.writer(output, quoting=csv.QUOTE_MINIMAL)
            
            # Write header
            writer.writerow(columns)
            
            # Write data rows
            writer.writerows(rows)
            
            logger.info("CSV export completed: %d rows", len(rows))
            return output.getvalue().encode('utf-8')
        except Exception as e:
            logger.error("Failed to export query results to CSV: %s", str(e))
            raise e

    def export_excel(self, columns, rows, sheet_name="Query Results"):
        """
        Exports the result set as a professionally formatted Excel (.xlsx) file in-memory.
        Returns a bytes object.
        """
        try:
            wb = Workbook()
            ws = wb.active
            ws.title = sheet_name[:31]  # Excel limits sheet names to 31 chars
            
            # Enable grid lines explicitly
            ws.views.sheetView[0].showGridLines = True

            # Styles definition
            header_font = Font(name='Segoe UI', size=11, bold=True, color='FFFFFF')
            header_fill = PatternFill(start_color='1F4E79', end_color='1F4E79', fill_type='solid') # Deep blue
            header_alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
            
            data_font = Font(name='Segoe UI', size=10)
            data_alignment_left = Alignment(horizontal='left', vertical='center')
            data_alignment_right = Alignment(horizontal='right', vertical='center')
            data_alignment_center = Alignment(horizontal='center', vertical='center')

            thin_border_side = Side(border_style="thin", color="D9D9D9")
            thin_border = Border(
                left=thin_border_side,
                right=thin_border_side,
                top=thin_border_side,
                bottom=thin_border_side
            )

            # Write header row
            for col_idx, col_name in enumerate(columns, 1):
                cell = ws.cell(row=1, column=col_idx, value=col_name.replace('_', ' ').title())
                cell.font = header_font
                cell.fill = header_fill
                cell.alignment = header_alignment
                cell.border = thin_border
            
            # Write data rows
            for row_idx, row in enumerate(rows, 2):
                for col_idx, val in enumerate(row, 1):
                    cell = ws.cell(row=row_idx, column=col_idx, value=val)
                    cell.font = data_font
                    cell.border = thin_border
                    
                    # Align based on data type and format numbers/currencies
                    if isinstance(val, (int, float)):
                        cell.alignment = data_alignment_right
                        if 'price' in columns[col_idx-1].lower() or 'amount' in columns[col_idx-1].lower() or 'revenue' in columns[col_idx-1].lower() or 'subtotal' in columns[col_idx-1].lower():
                            cell.number_format = '$#,##0.00'
                        elif isinstance(val, float):
                            cell.number_format = '#,##0.00'
                        else:
                            cell.number_format = '#,##0'
                    elif isinstance(val, str) and (val.startswith('20') and len(val) >= 10 and '-' in val): # Simple date check
                        cell.alignment = data_alignment_center
                    else:
                        cell.alignment = data_alignment_left

            # Set header row height
            ws.row_dimensions[1].height = 28

            # Auto-fit column widths
            for col in ws.columns:
                max_len = 0
                col_letter = get_column_letter(col[0].column)
                for cell in col:
                    if cell.value is not None:
                        val_str = str(cell.value)
                        # Account for currency formatting length boost
                        if cell.number_format == '$#,##0.00':
                            val_str = '$' + val_str
                        max_len = max(max_len, len(val_str))
                ws.column_dimensions[col_letter].width = max(max_len + 4, 12)

            # Save workbook to memory stream
            output = BytesIO()
            wb.save(output)
            xlsx_data = output.getvalue()
            
            logger.info("Excel export completed: %d rows", len(rows))
            return xlsx_data
        except Exception as e:
            logger.error("Failed to export query results to Excel: %s", str(e))
            raise e
