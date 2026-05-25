import re
import logging

logger = logging.getLogger('sql_assistant')


class ChartDetector:

    def detect(self, columns, rows):
        """
        Dynamically analyzes the result set and detects the best visualization type.
        
        Returns a dict:
        {
            "chart_type": "bar" | "line" | "pie" | "scatter" | "kpi" | "table",
            "x_axis": "column_name" or None,
            "y_axis": "column_name" or None,
            "metrics": ["col1", "col2"] or None,
            "title": "Suggested Chart Title"
        }
        """
        row_count = len(rows)
        col_count = len(columns)

        if row_count == 0 or col_count == 0:
            return self._default_table()

        # Gather column characteristics
        col_types = []  # List of ('numeric' | 'temporal' | 'categorical')
        for col in columns:
            col_types.append(self._infer_column_type(col, [r.get(col) for r in rows]))

        numeric_indices = [i for i, t in enumerate(col_types) if t == 'numeric']
        temporal_indices = [i for i, t in enumerate(col_types) if t == 'temporal']
        categorical_indices = [i for i, t in enumerate(col_types) if t == 'categorical']

        # 1. KPI Card: Single row, one or more numeric metrics
        if row_count == 1 and numeric_indices:
            metrics = [columns[i] for i in numeric_indices]
            return {
                'chart_type': 'kpi',
                'x_axis': None,
                'y_axis': None,
                'metrics': metrics,
                'title': 'Key Metrics Summary',
            }

        # 2. Line/Area Chart: Time-series / Chronological trends
        # We need a temporal column and at least one numeric column
        if temporal_indices and numeric_indices:
            x_col = columns[temporal_indices[0]]
            y_col = columns[numeric_indices[0]]
            title = f"Trend of {y_col.replace('_', ' ').title()} Over Time"
            return {
                'chart_type': 'line',
                'x_axis': x_col,
                'y_axis': y_col,
                'metrics': [columns[i] for i in numeric_indices],
                'title': title,
            }

        # 3. Pie/Donut Chart: Distributions of small cardinality
        # Text/Category + Numeric, and row count is low (<= 6 categories)
        if categorical_indices and numeric_indices and row_count <= 6:
            x_col = columns[categorical_indices[0]]
            y_col = columns[numeric_indices[0]]
            title = f"Distribution of {y_col.replace('_', ' ').title()} by {x_col.replace('_', ' ').title()}"
            return {
                'chart_type': 'pie',
                'x_axis': x_col,
                'y_axis': y_col,
                'metrics': [y_col],
                'title': title,
            }

        # 4. Bar Chart: Comparisons of medium cardinality
        # Text/Category + Numeric, row count <= 15
        if categorical_indices and numeric_indices and row_count <= 25:
            x_col = columns[categorical_indices[0]]
            y_col = columns[numeric_indices[0]]
            title = f"{y_col.replace('_', ' ').title()} by {x_col.replace('_', ' ').title()}"
            return {
                'chart_type': 'bar',
                'x_axis': x_col,
                'y_axis': y_col,
                'metrics': [y_col],
                'title': title,
            }

        # 5. Scatter Plot: Correlation between two numeric variables
        if len(numeric_indices) >= 2 and not categorical_indices:
            x_col = columns[numeric_indices[0]]
            y_col = columns[numeric_indices[1]]
            title = f"Correlation: {x_col.replace('_', ' ').title()} vs {y_col.replace('_', ' ').title()}"
            return {
                'chart_type': 'scatter',
                'x_axis': x_col,
                'y_axis': y_col,
                'metrics': [x_col, y_col],
                'title': title,
            }

        # 6. Fallback: Table only
        return self._default_table()

    def _default_table(self):
        return {
            'chart_type': 'table',
            'x_axis': None,
            'y_axis': None,
            'metrics': None,
            'title': 'Data Table',
        }

    def _infer_column_type(self, col_name, sample_values):
        col_lower = col_name.lower()

        # Identifiers are generally categorical/text representations, not numeric metrics
        if col_lower == 'id' or col_lower.endswith('_id'):
            return 'categorical'

        # Check by name first
        if any(w in col_lower for w in ('date', 'time', 'month', 'year', 'day', 'created', 'joined', 'ordered')):
            return 'temporal'

        if any(w in col_lower for w in ('price', 'amount', 'qty', 'quantity', 'total', 'revenue', 'subtotal', 'sales', 'rating', 'count', 'sum', 'avg')):
            return 'numeric'

        # Inspect values to see if they look numeric
        non_null_samples = [v for v in sample_values if v is not None]
        if not non_null_samples:
            return 'categorical'

        # If values are floats/ints
        if all(isinstance(v, (int, float)) for v in non_null_samples):
            return 'numeric'

        # Check if values look like ISO dates/timestamps
        iso_date_pattern = re.compile(r'^\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2}:\d{2})?(?:\.\d+)?(?:[+-]\d{2}:?\d{2}|Z)?$')
        if all(isinstance(v, str) and iso_date_pattern.match(v) for v in non_null_samples):
            return 'temporal'

        return 'categorical'
