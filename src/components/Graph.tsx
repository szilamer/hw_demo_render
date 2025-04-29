import React, { useEffect, useRef } from 'react';
import { Network } from 'vis-network/standalone/esm/vis-network';
import 'vis-network/styles/vis-network.css';
import { FaDisease, FaStethoscope, FaFlask, FaNotesMedical, FaFileAlt, FaSyringe, FaHeartbeat } from 'react-icons/fa';

// --- Node Styles ---
const NODE_ICONS = {
  disease: { shape: 'icon', icon: { face: 'FontAwesome', code: '\uf7fa', size: 100, color: '#e74c3c' }, size: 60 }, // FaDisease (Méretek duplázva)
  event: { shape: 'icon', icon: { face: 'FontAwesome', code: '\uf0f1', size: 100, color: '#3498db' }, size: 60 }, // FaStethoscope (Méretek duplázva)
  lab: { shape: 'icon', icon: { face: 'FontAwesome', code: '\uf0c3', size: 100, color: '#2ecc71' }, size: 60 }, // FaFlask (Méretek duplázva)
  labValue: { shape: 'icon', icon: { face: 'FontAwesome', code: '\uf481', size: 80, color: '#f1c40f' }, size: 50 }, // FaNotesMedical (Méretek duplázva)
  document: { shape: 'icon', icon: { face: 'FontAwesome', code: '\uf15c', size: 80, color: '#95a5a6' }, size: 50 }, // FaFileAlt (Méretek duplázva)
  treatment: { shape: 'icon', icon: { face: 'FontAwesome', code: '\uf48e', size: 80, color: '#8e44ad' }, size: 50 }, // FaSyringe (Méretek duplázva)
  symptom: { shape: 'icon', icon: { face: 'FontAwesome', code: '\uf21e', size: 80, color: '#e67e22' }, size: 50 } // FaHeartbeat (Méretek duplázva)
};

export interface GraphNode {
  id: string;
  label: string;
  type: 'disease' | 'event' | 'treatment' | 'lab' | 'labValue' | 'symptom' | 'document';
  timestamp?: Date;
  className?: string;
  description?: string;
}

export interface GraphEdge {
  from: string;
  to: string;
  label?: string;
  className?: string;
}

interface GraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onSelect: (id: string) => void;
}

const Graph: React.FC<GraphProps> = ({ nodes, edges, onSelect }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  
  // Add a ref to keep track of previous nodes/edges
  const prevNodesRef = useRef<GraphNode[]>([]);
  const prevEdgesRef = useRef<GraphEdge[]>([]);

  useEffect(() => {
    // Check if nodes or edges have changed
    const nodesChanged = nodes.length !== prevNodesRef.current.length;
    const edgesChanged = edges.length !== prevEdgesRef.current.length;
    
    // Update refs
    prevNodesRef.current = nodes;
    prevEdgesRef.current = edges;
    
    if (!containerRef.current || nodes.length === 0) return;
    
    // Adatok előkészítése
    const data = {
      nodes: nodes.map(node => {
        // Alapértelmezett node típus event, ha nincs megadva vagy nem ismert
        const nodeTypeStyle = NODE_ICONS[node.type] || NODE_ICONS.event;
        
        // Lab típusú node kezelése
        if (node.id.startsWith('lab_node_')) {
          return {
            ...node,
            ...NODE_ICONS.lab,
            label: node.timestamp 
              ? `${node.label}\n${node.timestamp.toLocaleDateString('hu-HU')}`
              : node.label,
            font: { 
              color: '#55efc4',
              size: 14,
              face: 'Arial',
              multi: 'html',
              bold: {
                color: '#55efc4',
                size: 14,
                face: 'Arial'
              },
              background: 'white'
            },
            title: node.description || node.label
          };
        }
        
        // Lab érték node kezelése
        if (node.id.startsWith('lab_crp_') || node.id.startsWith('lab_we_')) {
          return {
            ...node,
            ...NODE_ICONS.labValue,
            label: node.timestamp 
              ? `${node.label}\n${node.timestamp.toLocaleDateString('hu-HU')}`
              : node.label,
            title: node.description || node.label
          };
        }
        
        // Alapértelmezett formázás
        return {
          ...node,
          ...nodeTypeStyle,
          label: node.timestamp 
            ? `${node.label}\n${node.timestamp.toLocaleDateString('hu-HU')}`
            : node.label,
          font: { 
            color: node.type === 'disease' ? '#ff7675' : '#74b9ff',
            size: 14,
            face: 'Arial',
            multi: 'html',
            bold: {
              color: node.type === 'disease' ? '#ff7675' : '#74b9ff',
              size: 14,
              face: 'Arial'
            },
            background: 'white'
          },
          title: node.description || node.label
        };
      }),
      edges: edges.map(edge => ({
        ...edge,
        arrows: 'to',
        color: {
          color: '#848484',
          highlight: '#2B7CE9'
        }
      }))
    };

    // Gráf beállítások
    const options = {
      nodes: {
        // size: 100, // Ezt most a NODE_ICONS.size vezérli
        font: {
          size: 20,      // Nagyobb betűméret
          vadjust: -70 // Címke pozíciójának igazítása (nagyobbra állítva az ikon alá)
        },
        shadow: {
          enabled: true,
          color: 'rgba(0,0,0,0.2)',
          size: 20,
          x: 8,
          y: 8
        }
      },
      edges: {
        arrows: {
          to: {
            enabled: true,
            scaleFactor: 2
          }
        },
        width: 4,
        smooth: {
          enabled: true,
          type: 'cubicBezier',
          roundness: 0.5
        },
        color: {
          color: '#2c3e50',
          highlight: '#3498db',
          opacity: 1.0
        },
        shadow: {
          enabled: true,
          color: 'rgba(0,0,0,0.2)',
          size: 10
        }
      },
      physics: {
        stabilization: true,
        barnesHut: {
          gravitationalConstant: -80000,
          springConstant: 0.001,
          springLength: 400     // Növelt távolság a nagyobb node-ok miatt
        }
      },
      interaction: {
        hover: true,
        navigationButtons: true,
        tooltipDelay: 200,
        hideEdgesOnDrag: false  // Ne rejtse el az éleket húzáskor
      }
    };

    // Takarítsunk fel, ha már létezik egy hálózat
    if (networkRef.current) {
      networkRef.current.destroy();
      networkRef.current = null;
    }

    try {
      networkRef.current = new Network(containerRef.current, data, options);

      // Hover események kezelése
      networkRef.current.on('hoverNode', (params) => {
        const node = nodes.find(n => n.id === params.node);
        if (node && tooltipRef.current) {
          const position = networkRef.current!.getPositions([params.node])[params.node];
          const canvasRect = containerRef.current!.getBoundingClientRect();
          
          tooltipRef.current.innerHTML = `
            <div class="tooltip-content">
              <h3>${node.label}</h3>
              <p>Típus: ${node.type === 'disease' ? 'Betegség' : node.type === 'lab' ? 'Laborvizsgálat' : node.type === 'labValue' ? 'Labor érték' : 'Esemény'}</p>
              ${node.timestamp ? `<p>Dátum: ${node.timestamp.toLocaleDateString('hu-HU')}</p>` : ''}
              ${node.description ? `<p>${node.description}</p>` : ''}
            </div>
          `;
          
          tooltipRef.current.style.display = 'block';
          tooltipRef.current.style.left = `${canvasRect.left + position.x + 40}px`;
          tooltipRef.current.style.top = `${canvasRect.top + position.y - 20}px`;
        }
      });

      networkRef.current.on('blurNode', () => {
        if (tooltipRef.current) {
          tooltipRef.current.style.display = 'none';
        }
      });

      // Kiválasztás esemény
      networkRef.current.on('select', function(params) {
        if (params.nodes && params.nodes.length > 0) {
          onSelect(params.nodes[0]);
        }
      });

    } catch (error) {
      console.error("Hiba a hálózat létrehozása közben:", error);
    }

    return () => {
      if (networkRef.current) {
        networkRef.current.destroy();
        networkRef.current = null;
      }
    };
  }, [nodes, edges, onSelect]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      <div 
        ref={tooltipRef}
        style={{
          display: 'none',
          position: 'fixed',
          backgroundColor: 'white',
          padding: '10px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          zIndex: 1000,
          maxWidth: '250px'
        }}
      />
    </div>
  );
};

export default Graph; 