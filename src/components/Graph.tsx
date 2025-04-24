import React, { useEffect, useRef } from 'react';
import { Network } from 'vis-network/standalone';
import 'vis-network/styles/vis-network.css';

// Node típusok ikonjai
const NODE_ICONS = {
  disease: {
    shape: 'icon',
    icon: {
      face: '"Font Awesome 6 Free"',
      code: '\uf469',  // user-md ikon
      size: 80,        // Még nagyobb ikon méret
      color: '#ff7675',
    },
    size: 100         // Még nagyobb node méret
  },
  event: {
    shape: 'icon',
    icon: {
      face: '"Font Awesome 6 Free"',
      code: '\uf073',  // calendar ikon
      size: 80,        // Még nagyobb ikon méret
      color: '#74b9ff',
    },
    size: 100         // Még nagyobb node méret
  },
  lab: {
    shape: 'icon',
    icon: {
      face: '"Font Awesome 6 Free"',
      code: '\uf0f5',  // flask ikon
      size: 80,        // Még nagyobb ikon méret
      color: '#55efc4',
    },
    size: 100         // Még nagyobb node méret
  },
  labValue: {
    shape: 'box',
    color: {
      background: '#81ecec',
      border: '#00cec9',
      highlight: {
        background: '#00cec9',
        border: '#00b894'
      }
    },
    font: {
      color: '#2d3436',
      size: 14
    },
    borderWidth: 2,
    shadow: true
  }
};

export interface GraphNode {
  id: string;
  label: string;
  type: 'disease' | 'event' | 'lab' | 'labValue';
  timestamp?: Date;
  description?: string;
}

export interface GraphEdge {
  from: string;
  to: string;
  label?: string;
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

  useEffect(() => {
    if (containerRef.current && nodes.length > 0) {
      // Adatok előkészítése
      const data = {
        nodes: nodes.map(node => {
          // Alapértelmezett node típus event, ha nincs megadva vagy nem ismert
          const nodeType = NODE_ICONS[node.type] || NODE_ICONS.event;
          
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
            ...nodeType,
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
          size: 100,       // Nagyobb alapértelmezett méret
          font: {
            size: 20,      // Nagyobb betűméret
            vadjust: -120  // Címke pozíciójának igazítása a nagyobb mérethez
          },
          shadow: {
            enabled: true,
            color: 'rgba(0,0,0,0.2)',
            size: 20,      // Nagyobb árnyék
            x: 8,
            y: 8
          }
        },
        edges: {
          arrows: {
            to: {
              enabled: true,
              scaleFactor: 2  // Nagyobb nyilak
            }
          },
          width: 4,           // Vastagabb élek
          smooth: {
            enabled: true,
            type: 'cubicBezier',
            roundness: 0.5
          },
          color: {
            color: '#2c3e50',      // Sötétebb szín az éleknek
            highlight: '#3498db',   // Élénkebb kiemelő szín
            opacity: 1.0           // Teljes átlátszatlanság
          },
          shadow: {              // Árnyék az éleknek is
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
            springLength: 300     // Nagyobb távolság a node-ok között
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