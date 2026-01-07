import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  getKnowledgeGraph, 
  calculateKnowledgeProgress, 
  getKnowledgeStats, 
  CATEGORY_COLORS,
  findLearningPath 
} from '../lib/knowledgeGraph';

export default function KnowledgeGraphWidget({ studentData, courseId }) {
  const canvasRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [nodeProgress, setNodeProgress] = useState({});
  const [stats, setStats] = useState(null);
  const [learningPath, setLearningPath] = useState([]);
  
  const graph = getKnowledgeGraph(courseId);
  
  console.log("🔍 KnowledgeGraphWidget - Render con:", { studentData, courseId });
  console.log("🔍 KnowledgeGraphWidget - Graph:", graph);
  
  useEffect(() => {
    console.log("🔍 KnowledgeGraphWidget - useEffect triggered");
    if (!studentData) {
      console.log("🔍 KnowledgeGraphWidget - studentData is null, returning");
      return;
    }
    
    const progress = calculateKnowledgeProgress(studentData, courseId);
    const knowledgeStats = getKnowledgeStats(studentData, courseId);
    
    console.log("🔍 KnowledgeGraphWidget - Progress:", progress);
    console.log("🔍 KnowledgeGraphWidget - Stats:", knowledgeStats);
    
    setNodeProgress(progress);
    setStats(knowledgeStats);
    
    // Disegna il grafo
    console.log("🔍 KnowledgeGraphWidget - Chiamando drawGraph");
    drawGraph();
    
  }, [studentData, courseId]);
  
  const drawGraph = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.log("🔍 drawGraph - Canvas not found");
      return;
    }
    
    console.log("🔍 drawGraph - Canvas found, drawing...");
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    console.log("🔍 drawGraph - Canvas dimensions:", { width, height });
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Posiziona nodi in base a categoria e difficoltà
    const nodePositions = {};
    const categoryGroups = {};
    
    console.log("🔍 drawGraph - Processing graph nodes:", graph.nodes);
    
    // Raggruppa nodi per categoria
    graph.nodes.forEach(node => {
      if (!categoryGroups[node.category]) {
        categoryGroups[node.category] = [];
      }
      categoryGroups[node.category].push(node);
    });
    
    console.log("🔍 drawGraph - Category groups:", categoryGroups);
    
    // Posiziona i gruppi
    const categories = Object.keys(categoryGroups);
    const angleStep = (2 * Math.PI) / categories.length;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.3;
    
    categories.forEach((category, catIndex) => {
      const categoryAngle = catIndex * angleStep - Math.PI / 2;
      const categoryX = centerX + Math.cos(categoryAngle) * radius;
      const categoryY = centerY + Math.sin(categoryAngle) * radius;
      
      const nodesInCategory = categoryGroups[category];
      const nodeRadius = 40;
      const nodeAngleStep = (Math.PI / 2) / nodesInCategory.length;
      
      nodesInCategory.forEach((node, nodeIndex) => {
        const nodeAngle = categoryAngle - Math.PI / 4 + nodeIndex * nodeAngleStep;
        const nodeX = categoryX + Math.cos(nodeAngle) * nodeRadius;
        const nodeY = categoryY + Math.sin(nodeAngle) * nodeRadius;
        
        nodePositions[node.id] = { x: nodeX, y: nodeY, node };
      });
    });
    
    console.log("🔍 drawGraph - Node positions calculated:", Object.keys(nodePositions));
    
    // Disegna edges (connessioni)
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 2;
    
    graph.edges.forEach(edge => {
      const fromPos = nodePositions[edge.from];
      const toPos = nodePositions[edge.to];
      
      if (fromPos && toPos) {
        ctx.beginPath();
        ctx.moveTo(fromPos.x, fromPos.y);
        
        if (edge.type === 'prerequisite') {
          // Linea continua per prerequisiti
          ctx.lineTo(toPos.x, toPos.y);
          ctx.strokeStyle = '#9ca3af';
        } else {
          // Linea punteggiata per correlazioni
          ctx.setLineDash([5, 5]);
          ctx.lineTo(toPos.x, toPos.y);
          ctx.strokeStyle = '#d1d5db';
        }
        
        ctx.stroke();
        ctx.setLineDash([]);
      }
    });
    
    // Disegna nodi
    Object.values(nodePositions).forEach(({ x, y, node }) => {
      const progress = nodeProgress[node.id];
      const isHovered = hoveredNode?.id === node.id;
      const isSelected = selectedNode?.id === node.id;
      
      // Determina colore e stile
      let fillColor = CATEGORY_COLORS[node.category];
      let strokeColor = fillColor;
      let radius = 20;
      
      if (progress?.completed) {
        fillColor = '#10b981';
        strokeColor = '#059669';
      } else if (!progress?.accessible) {
        fillColor = '#e5e7eb';
        strokeColor = '#9ca3af';
      } else if (progress?.recommended) {
        strokeColor = '#f59e0b';
        radius = 22;
      }
      
      if (isHovered || isSelected) {
        radius += 5;
      }
      
      // Disegna cerchio del nodo
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = fillColor;
      ctx.fill();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = isSelected ? 4 : (isHovered ? 3 : 2);
      ctx.stroke();
      
      // Disegna progresso se parzialmente completato
      if (progress?.progress > 0 && !progress?.completed) {
        ctx.beginPath();
        ctx.arc(x, y, radius - 3, -Math.PI / 2, -Math.PI / 2 + (2 * Math.PI * progress.progress / 100));
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
      
      // Disegna testo
      ctx.fillStyle = progress?.completed ? '#ffffff' : '#374151';
      ctx.font = isHovered || isSelected ? 'bold 11px sans-serif' : '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Tronca testo se troppo lungo
      const maxWidth = radius * 1.5;
      let text = node.label;
      if (ctx.measureText(text).width > maxWidth) {
        text = text.substring(0, 8) + '...';
      }
      
      ctx.fillText(text, x, y);
    });
    
    // Salva posizioni per click detection
    canvas.nodePositions = nodePositions;
    
    console.log("🔍 drawGraph - Drawing completed");
  };
  
  const handleCanvasClick = (event) => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.nodePositions) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Trova nodo cliccato
    Object.values(canvas.nodePositions).forEach(({ x: nodeX, y: nodeY, node }) => {
      const distance = Math.sqrt((x - nodeX) ** 2 + (y - nodeY) ** 2);
      if (distance <= 25) {
        setSelectedNode(node);
        const path = findLearningPath(node.id, studentData, courseId);
        setLearningPath(path);
      }
    });
  };
  
  const handleCanvasMouseMove = (event) => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.nodePositions) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Trova nodo sotto mouse
    let foundNode = null;
    Object.values(canvas.nodePositions).forEach(({ x: nodeX, y: nodeY, node }) => {
      const distance = Math.sqrt((x - nodeX) ** 2 + (y - nodeY) ** 2);
      if (distance <= 25) {
        foundNode = node;
      }
    });
    
    setHoveredNode(foundNode);
    canvas.style.cursor = foundNode ? 'pointer' : 'default';
  };
  
  if (!stats) {
    return (
      <div style={{ marginBottom: 30, border: '2px solid #e5e7eb', borderRadius: 16, padding: 20, background: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 15 }}>
          <span style={{ fontSize: 24 }}>🧠</span>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, color: '#374151' }}>Knowledge Graph</h3>
            <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>
              Caricamento mappa concetti...
            </p>
          </div>
        </div>
        <div style={{ textAlign: 'center', padding: 20, color: '#6b7280' }}>
          <div style={{ fontSize: 12 }}>🔍 Analizzando il tuo percorso di apprendimento...</div>
        </div>
      </div>
    );
  }
  
  return (
    <div style={{ marginBottom: 30, border: '2px solid #e5e7eb', borderRadius: 16, padding: 20, background: '#fff' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 24 }}>🧠</span>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, color: '#374151' }}>Knowledge Graph</h3>
            <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>
              {stats.completedNodes}/{stats.totalNodes} concetti padroneggiati
            </p>
          </div>
        </div>
        
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#10b981' }}>{stats.overallProgress}%</div>
          <div className="muted" style={{ fontSize: 12, fontWeight: 700 }}>MASTERY</div>
        </div>
      </div>
      
      {/* Canvas del grafo */}
      <div style={{ position: 'relative', marginBottom: 20 }}>
        <canvas
          ref={canvasRef}
          width={600}
          height={400}
          style={{ 
            width: '100%', 
            height: 'auto', 
            border: '1px solid #e5e7eb', 
            borderRadius: 12,
            background: '#fafafa'
          }}
          onClick={handleCanvasClick}
          onMouseMove={handleCanvasMouseMove}
        />
        
        {/* Tooltip per nodo hover */}
        {hoveredNode && (
          <div style={{
            position: 'absolute',
            top: 10,
            left: 10,
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: 8,
            fontSize: 12,
            pointerEvents: 'none',
            zIndex: 10
          }}>
            <div style={{ fontWeight: 'bold' }}>{hoveredNode.label}</div>
            <div style={{ fontSize: 11, opacity: 0.8 }}>
              Difficoltà: {hoveredNode.difficulty}/7
            </div>
            <div style={{ fontSize: 11, opacity: 0.8 }}>
              Stato: {nodeProgress[hoveredNode.id]?.completed ? 'Completato' : 
                      nodeProgress[hoveredNode.id]?.accessible ? 'Disponibile' : 'Bloccato'}
            </div>
          </div>
        )}
      </div>
      
      {/* Stats per categoria */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginBottom: 20 }}>
        {Object.entries(stats.categoryProgress).map(([category, data]) => (
          <div key={category} style={{ textAlign: 'center' }}>
            <div style={{ 
              width: 12, 
              height: 12, 
              background: CATEGORY_COLORS[category], 
              borderRadius: '50%', 
              margin: '0 auto 4px'
            }} />
            <div style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>
              {data.completed}/{data.total}
            </div>
            <div style={{ fontSize: 10, color: '#6b7280', textTransform: 'capitalize' }}>
              {category}
            </div>
          </div>
        ))}
      </div>
      
      {/* Dettagli nodo selezionato */}
      {selectedNode && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ 
            padding: 15, 
            background: '#f3f4f6', 
            borderRadius: 12, 
            border: `2px solid ${CATEGORY_COLORS[selectedNode.category]}` 
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 10 }}>
            <div>
              <h4 style={{ margin: 0, color: '#374151', fontSize: 16 }}>{selectedNode.label}</h4>
              <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>
                Categoria: {selectedNode.category} • Difficoltà: {selectedNode.difficulty}/7
              </p>
            </div>
            <button 
              onClick={() => setSelectedNode(null)}
              style={{ background: 'none', border: 'none', fontSize: 16, cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>
          
          {learningPath.length > 1 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4 }}>
                🛤️ Percorso di apprendimento:
              </div>
              <div style={{ fontSize: 11, color: '#6b7280' }}>
                {learningPath.map(nodeId => {
                  const node = graph.nodes.find(n => n.id === nodeId);
                  return node.label;
                }).join(' → ')}
              </div>
            </div>
          )}
          
          <div style={{ display: 'flex', gap: 8 }}>
            {nodeProgress[selectedNode.id]?.completed ? (
              <span style={{ 
                background: '#dcfce7', 
                color: '#166534', 
                padding: '4px 8px', 
                borderRadius: 4, 
                fontSize: 11, 
                fontWeight: 700 
              }}>
                ✅ Completato
              </span>
            ) : nodeProgress[selectedNode.id]?.accessible ? (
              <span style={{ 
                background: '#fef3c7', 
                color: '#92400e', 
                padding: '4px 8px', 
                borderRadius: 4, 
                fontSize: 11, 
                fontWeight: 700 
              }}>
                🎯 Disponibile
              </span>
            ) : (
              <span style={{ 
                background: '#f3f4f6', 
                color: '#6b7280', 
                padding: '4px 8px', 
                borderRadius: 4, 
                fontSize: 11, 
                fontWeight: 700 
              }}>
                🔒 Prerequisiti richiesti
              </span>
            )}
          </div>
        </motion.div>
      )}
      
      {/* Legend */}
      <div style={{ display: 'flex', gap: 15, fontSize: 11, color: '#6b7280', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 10, height: 10, background: '#10b981', borderRadius: '50%' }} />
          <span>Completato</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 10, height: 10, background: '#f59e0b', borderRadius: '50%' }} />
          <span>Raccomandato</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 10, height: 10, background: '#e5e7eb', borderRadius: '50%' }} />
          <span>Bloccato</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 10, height: 10, background: '#9ca3af', borderRadius: '50%' }} />
          <span>Disponibile</span>
        </div>
      </div>
      
    </div>
  );
}
