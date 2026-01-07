/**
 * KNOWLEDGE GRAPH VISUAL
 * Sistema per visualizzare relazioni tra concetti e progresso
 */

import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

// Struttura del knowledge graph per contabilità
export const KNOWLEDGE_GRAPH = {
  accounting: {
    nodes: [
      // Fondamenti
      { id: 'partita-doppia', label: 'Partita Doppia', category: 'fundamentals', difficulty: 1, prerequisites: [] },
      { id: 'bilancio', label: 'Bilancio', category: 'fundamentals', difficulty: 2, prerequisites: ['partita-doppia'] },
      { id: 'contabilita-generale', label: 'Contabilità Generale', category: 'fundamentals', difficulty: 2, prerequisites: ['partita-doppia'] },
      
      // Asset Management
      { id: 'immobilizzazioni', label: 'Immobilizzazioni', category: 'assets', difficulty: 3, prerequisites: ['bilancio'] },
      { id: 'rimanenze', label: 'Rimanenze', category: 'assets', difficulty: 3, prerequisites: ['bilancio'] },
      { id: 'crediti', label: 'Crediti Commerciali', category: 'assets', difficulty: 3, prerequisites: ['contabilita-generale'] },
      
      // Liabilities & Equity
      { id: 'debiti-fornitori', label: 'Debiti Fornitori', category: 'liabilities', difficulty: 3, prerequisites: ['contabilita-generale'] },
      { id: 'mutui', label: 'Mutui e Finanziamenti', category: 'liabilities', difficulty: 4, prerequisites: ['bilancio'] },
      { id: 'patrimonio-netto', label: 'Patrimonio Netto', category: 'equity', difficulty: 4, prerequisites: ['bilancio'] },
      
      // Advanced
      { id: 'ammortamenti', label: 'Ammortamenti', category: 'advanced', difficulty: 4, prerequisites: ['immobilizzazioni'] },
      { id: 'ricavi-e-costi', label: 'Ricavi e Costi', category: 'advanced', difficulty: 4, prerequisites: ['contabilita-generale'] },
      { id: 'conto-economico', label: 'Conto Economico', category: 'advanced', difficulty: 5, prerequisites: ['ricavi-e-costi', 'bilancio'] },
      { id: 'rendiconto-finanziario', label: 'Rendiconto Finanziario', category: 'advanced', difficulty: 5, prerequisites: ['bilancio', 'conto-economico'] },
      
      // Expert
      { id: 'analisi-di-bilancio', label: 'Analisi di Bilancio', category: 'expert', difficulty: 6, prerequisites: ['conto-economico', 'rendiconto-finanziario'] },
      { id: 'business-valuation', label: 'Business Valuation', category: 'expert', difficulty: 7, prerequisites: ['analisi-di-bilancio'] }
    ],
    
    edges: [
      // Relazioni di prerequisito
      { from: 'partita-doppia', to: 'bilancio', type: 'prerequisite' },
      { from: 'partita-doppia', to: 'contabilita-generale', type: 'prerequisite' },
      { from: 'bilancio', to: 'immobilizzazioni', type: 'prerequisite' },
      { from: 'bilancio', to: 'rimanenze', type: 'prerequisite' },
      { from: 'contabilita-generale', to: 'crediti', type: 'prerequisite' },
      { from: 'contabilita-generale', to: 'debiti-fornitori', type: 'prerequisite' },
      { from: 'bilancio', to: 'mutui', type: 'prerequisite' },
      { from: 'bilancio', to: 'patrimonio-netto', type: 'prerequisite' },
      { from: 'immobilizzazioni', to: 'ammortamenti', type: 'prerequisite' },
      { from: 'contabilita-generale', to: 'ricavi-e-costi', type: 'prerequisite' },
      { from: 'ricavi-e-costi', to: 'conto-economico', type: 'prerequisite' },
      { from: 'bilancio', to: 'conto-economico', type: 'prerequisite' },
      { from: 'bilancio', to: 'rendiconto-finanziario', type: 'prerequisite' },
      { from: 'conto-economico', to: 'rendiconto-finanziario', type: 'prerequisite' },
      { from: 'conto-economico', to: 'analisi-di-bilancio', type: 'prerequisite' },
      { from: 'rendiconto-finanziario', to: 'analisi-di-bilancio', type: 'prerequisite' },
      { from: 'analisi-di-bilancio', to: 'business-valuation', type: 'prerequisite' },
      
      // Relazioni correlate
      { from: 'immobilizzazioni', to: 'ammortamenti', type: 'related' },
      { from: 'crediti', to: 'debiti-fornitori', type: 'related' },
      { from: 'mutui', to: 'patrimonio-netto', type: 'related' }
    ]
  },
  
  cloud: {
    nodes: [
      // Cloud Basics
      { id: 'cloud-fundamentals', label: 'Cloud Fundamentals', category: 'basics', difficulty: 1, prerequisites: [] },
      { id: 'iaas-paas-saas', label: 'IaaS, PaaS, SaaS', category: 'basics', difficulty: 2, prerequisites: ['cloud-fundamentals'] },
      { id: 'virtualization', label: 'Virtualizzazione', category: 'basics', difficulty: 2, prerequisites: ['cloud-fundamentals'] },
      
      // Compute
      { id: 'ec2-instances', label: 'EC2 Instances', category: 'compute', difficulty: 3, prerequisites: ['iaas-paas-saas'] },
      { id: 'containers', label: 'Containers & Docker', category: 'compute', difficulty: 3, prerequisites: ['virtualization'] },
      { id: 'kubernetes', label: 'Kubernetes', category: 'compute', difficulty: 4, prerequisites: ['containers'] },
      { id: 'serverless', label: 'Serverless Computing', category: 'compute', difficulty: 4, prerequisites: ['iaas-paas-saas'] },
      
      // Storage
      { id: 'object-storage', label: 'Object Storage', category: 'storage', difficulty: 3, prerequisites: ['iaas-paas-saas'] },
      { id: 'block-storage', label: 'Block Storage', category: 'storage', difficulty: 3, prerequisites: ['virtualization'] },
      { id: 'database-services', label: 'Database Services', category: 'storage', difficulty: 4, prerequisites: ['object-storage'] },
      
      // Networking
      { id: 'vpc', label: 'Virtual Private Cloud', category: 'networking', difficulty: 3, prerequisites: ['iaas-paas-saas'] },
      { id: 'load-balancing', label: 'Load Balancing', category: 'networking', difficulty: 4, prerequisites: ['vpc'] },
      { id: 'cdn', label: 'CDN & Content Delivery', category: 'networking', difficulty: 4, prerequisites: ['load-balancing'] },
      
      // Advanced
      { id: 'microservices', label: 'Microservices', category: 'advanced', difficulty: 5, prerequisites: ['kubernetes', 'serverless'] },
      { id: 'devops', label: 'DevOps & CI/CD', category: 'advanced', difficulty: 5, prerequisites: ['microservices'] },
      { id: 'monitoring', label: 'Monitoring & Logging', category: 'advanced', difficulty: 5, prerequisites: ['devops'] },
      
      // Expert
      { id: 'cloud-architecture', label: 'Cloud Architecture', category: 'expert', difficulty: 6, prerequisites: ['microservices', 'monitoring'] },
      { id: 'cloud-security', label: 'Cloud Security', category: 'expert', difficulty: 6, prerequisites: ['cloud-architecture'] },
      { id: 'cost-optimization', label: 'Cost Optimization', category: 'expert', difficulty: 7, prerequisites: ['cloud-architecture'] }
    ],
    
    edges: [
      // Prerequisites
      { from: 'cloud-fundamentals', to: 'iaas-paas-saas', type: 'prerequisite' },
      { from: 'cloud-fundamentals', to: 'virtualization', type: 'prerequisite' },
      { from: 'iaas-paas-saas', to: 'ec2-instances', type: 'prerequisite' },
      { from: 'iaas-paas-saas', to: 'serverless', type: 'prerequisite' },
      { from: 'virtualization', to: 'containers', type: 'prerequisite' },
      { from: 'containers', to: 'kubernetes', type: 'prerequisite' },
      { from: 'iaas-paas-saas', to: 'object-storage', type: 'prerequisite' },
      { from: 'virtualization', to: 'block-storage', type: 'prerequisite' },
      { from: 'object-storage', to: 'database-services', type: 'prerequisite' },
      { from: 'iaas-paas-saas', to: 'vpc', type: 'prerequisite' },
      { from: 'vpc', to: 'load-balancing', type: 'prerequisite' },
      { from: 'load-balancing', to: 'cdn', type: 'prerequisite' },
      { from: 'kubernetes', to: 'microservices', type: 'prerequisite' },
      { from: 'serverless', to: 'microservices', type: 'prerequisite' },
      { from: 'microservices', to: 'devops', type: 'prerequisite' },
      { from: 'devops', to: 'monitoring', type: 'prerequisite' },
      { from: 'microservices', to: 'cloud-architecture', type: 'prerequisite' },
      { from: 'monitoring', to: 'cloud-architecture', type: 'prerequisite' },
      { from: 'cloud-architecture', to: 'cloud-security', type: 'prerequisite' },
      { from: 'cloud-architecture', to: 'cost-optimization', type: 'prerequisite' }
    ]
  }
};

// Colori per categorie
export const CATEGORY_COLORS = {
  fundamentals: '#3b82f6',
  basics: '#3b82f6',
  assets: '#10b981',
  compute: '#8b5cf6',
  liabilities: '#f59e0b',
  storage: '#06b6d4',
  equity: '#ef4444',
  networking: '#84cc16',
  advanced: '#f97316',
  expert: '#dc2626'
};

// Ottieni knowledge graph per corso
export const getKnowledgeGraph = (courseId) => {
  return KNOWLEDGE_GRAPH[courseId] || KNOWLEDGE_GRAPH.accounting;
};

// Calcola progresso knowledge graph
export const calculateKnowledgeProgress = (studentData, courseId) => {
  const graph = getKnowledgeGraph(courseId);
  const completedLevels = studentData.completedLevels || [];
  const levelProgress = studentData.levelProgress || {};
  
  const nodeProgress = {};
  
  graph.nodes.forEach(node => {
    const levelId = node.id;
    const isCompleted = completedLevels.includes(levelId);
    const progress = levelProgress[levelId] || 0;
    
    nodeProgress[node.id] = {
      completed: isCompleted,
      progress: progress,
      accessible: checkPrerequisites(node, completedLevels),
      recommended: checkRecommended(node, completedLevels, levelProgress)
    };
  });
  
  return nodeProgress;
};

// Verifica se i prerequisiti sono completati
const checkPrerequisites = (node, completedLevels) => {
  return node.prerequisites.every(prereq => completedLevels.includes(prereq));
};

// Verifica se il nodo è raccomandato
const checkRecommended = (node, completedLevels, levelProgress) => {
  // Se è completato, non è raccomandato
  if (completedLevels.includes(node.id)) return false;
  
  // Se ha tutti i prerequisiti, è raccomandato
  const hasPrerequisites = checkPrerequisites(node, completedLevels);
  if (hasPrerequisites) return true;
  
  // Se ha almeno un prerequisito completato, potrebbe essere raccomandato
  const hasSomePrerequisites = node.prerequisites.some(prereq => completedLevels.includes(prereq));
  return hasSomePrerequisites;
};

// Trova percorso di apprendimento
export const findLearningPath = (targetNodeId, studentData, courseId) => {
  const graph = getKnowledgeGraph(courseId);
  const completedLevels = studentData.completedLevels || [];
  
  // BFS per trovare il percorso più breve
  const queue = [{ node: targetNodeId, path: [targetNodeId] }];
  const visited = new Set();
  
  while (queue.length > 0) {
    const { node, path } = queue.shift();
    
    if (visited.has(node)) continue;
    visited.add(node);
    
    // Se tutti i prerequisiti sono completati, abbiamo trovato il percorso
    const nodeData = graph.nodes.find(n => n.id === node);
    if (checkPrerequisites(nodeData, completedLevels)) {
      return path.reverse();
    }
    
    // Aggiungi i prerequisiti alla coda
    nodeData.prerequisites.forEach(prereq => {
      if (!visited.has(prereq)) {
        queue.unshift({ node: prereq, path: [prereq, ...path] });
      }
    });
  }
  
  return [];
};

// Calcola statistiche knowledge graph
export const getKnowledgeStats = (studentData, courseId) => {
  const graph = getKnowledgeGraph(courseId);
  const nodeProgress = calculateKnowledgeProgress(studentData, courseId);
  
  const stats = {
    totalNodes: graph.nodes.length,
    completedNodes: 0,
    accessibleNodes: 0,
    recommendedNodes: 0,
    categoryProgress: {}
  };
  
  graph.nodes.forEach(node => {
    const progress = nodeProgress[node.id];
    
    if (progress.completed) stats.completedNodes++;
    if (progress.accessible) stats.accessibleNodes++;
    if (progress.recommended) stats.recommendedNodes++;
    
    // Statistiche per categoria
    if (!stats.categoryProgress[node.category]) {
      stats.categoryProgress[node.category] = { total: 0, completed: 0 };
    }
    stats.categoryProgress[node.category].total++;
    if (progress.completed) {
      stats.categoryProgress[node.category].completed++;
    }
  });
  
  stats.overallProgress = Math.round((stats.completedNodes / stats.totalNodes) * 100);
  
  return stats;
};
