'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

const categories: Record<string, { queries: { q: string; sql: string }[] }> = {
  'My Data': {
    queries: [
      { q: 'How many products did I purchase?', sql: "SELECT COUNT(DISTINCT oi.product_id) AS products_purchased\nFROM order_items oi\nJOIN orders o ON oi.order_id = o.id\nWHERE o.user_id = {{USER_ID}};" },
      { q: 'What is my total spending?', sql: "SELECT SUM(o.total_amount) AS total_spending\nFROM orders o\nWHERE o.user_id = {{USER_ID}};" },
    ],
  },
  Aggregation: {
    queries: [
      { q: 'My total revenue by customer tier', sql: "SELECT c.tier, SUM(o.total_amount) AS revenue\nFROM customers c JOIN orders o ON c.id = o.customer_id\nWHERE c.user_id = {{USER_ID}}\nGROUP BY c.tier ORDER BY revenue DESC;" },
      { q: 'My average order value per month', sql: "SELECT TO_CHAR(order_date, 'YYYY-MM') AS month,\n  AVG(total_amount) AS avg_order\nFROM orders WHERE user_id = {{USER_ID}}\nGROUP BY month ORDER BY month;" },
    ],
  },
  Ranking: {
    queries: [
      { q: 'My top 10 customers by revenue', sql: "SELECT c.name, SUM(o.total_amount) AS total\nFROM customers c JOIN orders o ON c.id = o.customer_id\nWHERE c.user_id = {{USER_ID}}\nGROUP BY c.name ORDER BY total DESC LIMIT 10;" },
      { q: 'My top 5 products by review rating', sql: "SELECT p.name, AVG(r.rating) AS avg_rating\nFROM products p JOIN reviews r ON p.id = r.product_id\nWHERE p.user_id = {{USER_ID}}\nGROUP BY p.name ORDER BY avg_rating DESC LIMIT 5;" },
    ],
  },
  Trends: {
    queries: [
      { q: 'Show my recent orders', sql: "SELECT o.id, c.name, o.total_amount, o.status, o.order_date\nFROM orders o JOIN customers c ON o.customer_id = c.id\nWHERE o.user_id = {{USER_ID}}\nORDER BY o.order_date DESC LIMIT 10;" },
      { q: 'Which category do I buy most?', sql: "SELECT cat.name, COUNT(*) AS purchase_count\nFROM order_items oi\nJOIN orders o ON oi.order_id = o.id\nJOIN products p ON oi.product_id = p.id\nJOIN categories cat ON p.category_id = cat.id\nWHERE o.user_id = {{USER_ID}}\nGROUP BY cat.name ORDER BY purchase_count DESC;" },
    ],
  },
};

export default function SampleQueries() {
  const [activeCategory, setActiveCategory] = useState('My Data');
  const [hoveredQuery, setHoveredQuery] = useState<string | null>(null);

  return (
    <section className="py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-text-primary">Sample Queries</h2>
          <p className="mt-3 text-text-muted text-lg">Click any chip to see the generated SQL.</p>
        </motion.div>

        {/* Category tabs */}
        <div className="flex justify-center gap-2 mb-8 flex-wrap">
          {Object.keys(categories).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeCategory === cat
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                  : 'bg-bg-surface border border-border text-text-muted hover:text-text-primary'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Query chips */}
        <div className="flex flex-wrap justify-center gap-3">
          {categories[activeCategory].queries.map((item) => (
            <div key={item.q} className="relative">
              <button
                onMouseEnter={() => setHoveredQuery(item.q)}
                onMouseLeave={() => setHoveredQuery(null)}
                className="px-4 py-2.5 rounded-xl border border-border bg-bg-surface/50 text-sm text-text-primary hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all"
              >
                {item.q}
              </button>
              {hoveredQuery === item.q && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute z-20 top-full mt-2 left-0 w-80 p-4 rounded-xl border border-indigo-500/30 bg-slate-950 shadow-2xl"
                >
                  <p className="text-xs text-indigo-400 font-semibold mb-2">Generated SQL</p>
                  <pre className="text-xs text-emerald-400 font-mono whitespace-pre-wrap">{item.sql}</pre>
                </motion.div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
