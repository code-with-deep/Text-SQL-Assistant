'use client';

import React, { useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  MarkerType,
  Edge,
  Node,
  useNodesState,
  useEdgesState
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useSchemaStore } from '@/stores/schemaStore';
import { Eye, Database, ArrowRight, Download } from 'lucide-react';

// Define empty types outside component to prevent React Flow #002 warning
const nodeTypes = {};
const edgeTypes = {};

export default function ERDiagram() {
  const { tables, relationships, selectTable, selectedTable } = useSchemaStore();

  // Create Nodes (Grid layout calculation)
  const nodes: Node[] = useMemo(() => {
    const cols = 2;
    const gapX = 280;
    const gapY = 220;

    return tables.map((table, idx) => {
      const row = Math.floor(idx / cols);
      const col = idx % cols;
      const isSelected = selectedTable?.name === table.name;

      return {
        id: table.name,
        type: 'default',
        position: { x: col * gapX + 40, y: row * gapY + 40 },
        data: {
          label: (
            <div className="flex flex-col text-left gap-1 font-sans">
              <div className="flex items-center gap-1.5 font-bold text-xs text-indigo-400 border-b border-border/40 pb-1 uppercase">
                <Database className="w-3.5 h-3.5 shrink-0" />
                <span>{table.name}</span>
              </div>
              <div className="flex flex-col text-[10px] text-text-muted mt-1 gap-0.5">
                <span>• Columns: {table.column_count}</span>
                <span>• Row count: {table.row_count}</span>
              </div>
            </div>
          )
        },
        style: {
          background: 'var(--bg-surface)',
          color: 'var(--text-primary)',
          border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
          borderRadius: '12px',
          padding: '12px',
          width: 200,
          boxShadow: isSelected ? '0 10px 15px -3px rgba(99, 102, 241, 0.25)' : '0 4px 6px -1px rgba(0,0,0,0.1)'
        }
      };
    });
  }, [tables, selectedTable]);

  // Create Edges from database relationships list
  const edges: Edge[] = useMemo(() => {
    return relationships.map((rel, idx) => ({
      id: `e-${idx}-${rel.from_table}-${rel.to_table}`,
      source: rel.from_table,
      target: rel.to_table,
      label: `${rel.from_column} → ${rel.to_column}`,
      animated: true,
      style: { stroke: 'var(--primary)', strokeWidth: 1.5 },
      labelStyle: { fill: 'var(--text-muted)', fontSize: 8, fontWeight: 700, fontFamily: 'monospace' },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: 'var(--primary)'
      }
    }));
  }, [relationships]);

  const onNodeClick = (_: React.MouseEvent, node: Node) => {
    selectTable(node.id).catch(console.error);
  };

  const handleExportPng = () => {
    const svg = document.querySelector('.react-flow__renderer svg');
    if (svg) {
      const svgString = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const blobURL = URL.createObjectURL(svgBlob);
      
      const link = document.createElement('a');
      link.href = blobURL;
      link.download = 'er_diagram.svg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobURL);
    }
  };

  if (tables.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-bg-surface border border-border rounded-2xl text-center min-h-[400px]">
        <Database className="w-10 h-10 text-text-muted mb-3 opacity-60 animate-pulse" />
        <span className="text-sm font-semibold text-text-muted">Analyzing relational schema...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-bg-surface border border-border rounded-2xl shadow-xl overflow-hidden relative min-h-[450px]">
      {/* Top action control bar */}
      <div className="flex justify-between items-center px-4 py-3 border-b border-border bg-bg-surface/50 select-none z-10 relative">
        <div className="flex items-center gap-1.5">
          <Eye className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
            Interactive Schema Map
          </span>
        </div>
        <button
          onClick={handleExportPng}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border hover:bg-bg-elevated text-[10px] font-semibold text-text-muted hover:text-text-primary transition-colors cursor-pointer"
          title="Export diagram layout as SVG vector graph"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export SVG</span>
        </button>
      </div>

      {/* ReactFlow Canvas container */}
      <div className="flex-1 w-full h-[400px] min-h-[400px]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodeClick={onNodeClick}
          fitView
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          attributionPosition="bottom-right"
        >
          <Background color="var(--border)" gap={16} size={1} style={{ opacity: 0.3 }} />
          <Controls className="bg-bg-surface border border-border text-text-primary rounded-xl fill-current" />
          <MiniMap
            nodeStrokeColor={() => 'var(--primary)'}
            nodeColor={() => 'var(--bg-base)'}
            maskColor="rgba(0,0,0,0.4)"
            className="border border-border rounded-xl overflow-hidden bg-bg-surface hidden sm:block"
          />
        </ReactFlow>
      </div>
    </div>
  );
}
