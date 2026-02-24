import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ReactFlow,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    MiniMap,
    ReactFlowProvider
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import ReportNodeCard from './ReportNodeCard';
import GroupNodeCard from './GroupNodeCard';
import CitationNodeCard from './CitationNodeCard';
import Modal from '../ui/Modal';
import useHistory from '../../hooks/useHistory';

// Define the custom node mapping
const nodeTypes = {
    reportCard: ReportNodeCard,
    groupCard: GroupNodeCard,
    citationCard: CitationNodeCard
};

// Mock data structured into nodes
const initialNodes = [
    {
        id: 'lit-review',
        type: 'reportCard',
        position: { x: 50, y: 50 },
        data: {
            title: 'Literature Review',
            summary: 'Analyzing the trajectory of quantum AI models reveals a convergence point between deep neural processing and cryptographic acceleration.',
            citations: [
                {
                    source: 'Quantum Computing: A New Era',
                    snippet: 'Section 2.1: Historical topologies show significant bottlenecks in matrix multiplication that Qubits can solve...'
                },
                {
                    source: 'Advances in Neural Networks',
                    snippet: 'Page 40: Sparse activations are only a band-aid before hardware transitions to non-von Neumann architectures.'
                }
            ]
        },
    },
    {
        id: 'core-findings',
        type: 'reportCard',
        position: { x: 500, y: 150 },
        data: {
            title: 'Core Findings',
            summary: 'The primary hypothesis regarding energy efficiency was proven true in controlled environments.',
            citations: [
                {
                    source: 'The Future of AI Research',
                    snippet: 'Table 4: Energy consumption drops by 40% when utilizing dedicated neuromorphic processors.'
                }
            ]
        },
    },
    {
        id: 'common-points',
        type: 'reportCard',
        position: { x: 50, y: 450 },
        data: {
            title: 'Common Points Discovered',
            summary: 'All three papers consistently highlight the "Moore\'s Law Plateau" as the driving factor for recent architectural shifts.',
            citations: [
                {
                    source: 'Advances in Neural Networks',
                    snippet: 'Conclusion: The physical limits of silicon gating have been reached.'
                },
                {
                    source: 'The Future of AI Research',
                    snippet: '...suggesting that software engineering now bears the burden previously carried by hardware miniaturization.'
                }
            ]
        },
    },
    {
        id: 'key-takeaways',
        type: 'reportCard',
        position: { x: 950, y: 50 },
        data: {
            title: 'Key Takeaways',
            summary: 'Researchers must pivot toward hybrid models. Pure classical deep learning is no longer a viable long-term research vector for massive datasets.',
            citations: []
        },
    },
];

const initialEdges = [
    { id: 'e-lit-core', source: 'lit-review', target: 'core-findings', animated: true, style: { stroke: 'rgba(0, 148, 54, 0.4)', strokeWidth: 2 } },
    { id: 'e-lit-common', source: 'lit-review', target: 'common-points', animated: true, style: { stroke: 'rgba(0, 148, 54, 0.4)', strokeWidth: 2 } },
    { id: 'e-core-key', source: 'core-findings', target: 'key-takeaways', animated: true, style: { stroke: 'rgba(0, 148, 54, 0.4)', strokeWidth: 2 } },
];

const STORAGE_KEY = 'agentic_researcher_canvas_data';

// Workspace ID must be passed as a prop once backend integration is live.
// For now, it is read from the prop and savves are no-ops if absent.
const WorkspaceCanvas = ({ onBack, workspaceId }) => {
    // Lazily initialize state from LocalStorage if it exists
    const [nodes, setNodes, onNodesChange] = useNodesState(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed.nodes && parsed.nodes.length > 0) return parsed.nodes;
            } catch (e) {
                console.error('Error parsing canvas data from local storage', e);
            }
        }
        return initialNodes;
    });

    const [edges, setEdges, onEdgesChange] = useEdgesState(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed.edges) return parsed.edges;
            } catch (e) { }
        }
        return initialEdges;
    });

    // History Hook
    const { takeSnapshot, undo, redo, canUndo, canRedo } = useHistory();

    // ── Autosave: single-slot queue model ──────────────────────────────────
    const [isSaving, setIsSaving] = useState(false);
    const [hasPendingSave, setHasPendingSave] = useState(false);
    const [saveStatus, setSaveStatus] = useState(null); // 'saved' | 'conflict' | null
    const latestStateRef = useRef({ nodes: [], edges: [], version: 1 });
    const isSavingRef = useRef(false);       // mirrors isSaving without stale-closure issues
    const hasPendingRef = useRef(false);     // mirrors hasPendingSave

    // Keep version in a ref so saveCanvas always reads the latest value
    const versionRef = useRef(1);

    const saveCanvas = useCallback(async () => {
        if (!workspaceId) return;            // no-op until backend is wired

        if (isSavingRef.current) {
            hasPendingRef.current = true;
            setHasPendingSave(true);
            return;
        }

        isSavingRef.current = true;
        setIsSaving(true);

        const { nodes: n, edges: e } = latestStateRef.current;

        try {
            const res = await fetch(`/api/workspaces/${workspaceId}/canvas`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ nodes: n, edges: e, version: versionRef.current }),
            });

            const json = await res.json();

            if (res.ok) {
                // Update version from server response
                versionRef.current = json.data.version;
                setSaveStatus('saved');
                setTimeout(() => setSaveStatus(null), 2000);
            } else if (res.status === 409) {
                // Version conflict: replace local state with server's authoritative state
                versionRef.current = json.data.version;
                setNodes(json.data.nodes);
                setEdges(json.data.edges);
                setSaveStatus('conflict');
                setTimeout(() => setSaveStatus(null), 3000);
            }
            // 400 / 500 are silently ignored per spec (no logging yet)
        } catch (_err) {
            // Network error — silently swallow
        } finally {
            isSavingRef.current = false;
            setIsSaving(false);

            if (hasPendingRef.current) {
                hasPendingRef.current = false;
                setHasPendingSave(false);
                saveCanvas();
            }
        }
    }, [workspaceId]); // setNodes/setEdges are stable refs from useNodesState/useEdgesState

    // Keep latestStateRef in sync on every render (no extra re-render cost)
    useEffect(() => {
        latestStateRef.current = { nodes, edges, version: versionRef.current };
    });

    // Debounced autosave — fires 800ms after nodes/edges settle
    useEffect(() => {
        const timer = setTimeout(() => saveCanvas(), 800);
        return () => clearTimeout(timer);
    }, [nodes, edges, saveCanvas]);

    // Legacy localStorage persistence (kept alongside backend save)
    useEffect(() => {
        if (nodes.length > 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ nodes, edges }));
        }
    }, [nodes, edges]);

    const onConnect = useCallback(
        (params) => {
            takeSnapshot(nodes, edges);
            setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: 'rgba(0, 148, 54, 0.4)', strokeWidth: 2 } }, eds));
            saveCanvas();
        },
        [setEdges, nodes, edges, takeSnapshot, saveCanvas],
    );

    const onNodeDragStart = useCallback(() => {
        takeSnapshot(nodes, edges);
    }, [nodes, edges, takeSnapshot]);

    const onNodeDragStop = useCallback(() => {
        saveCanvas();
    }, [saveCanvas]);

    // Deletion Modal State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [nodesToDelete, setNodesToDelete] = useState([]);

    const onNodesDelete = useCallback((deleted) => {
        // Prevent default behavior, open modal instead
        setNodesToDelete(deleted);
        setDeleteModalOpen(true);
    }, []);

    const confirmDelete = () => {
        takeSnapshot(nodes, edges);

        const deletedIds = nodesToDelete.map((n) => n.id);
        setNodes((nds) => nds.filter((n) => !deletedIds.includes(n.id)));
        setEdges((eds) => eds.filter(
            (e) => !deletedIds.includes(e.source) && !deletedIds.includes(e.target)
        ));
        setDeleteModalOpen(false);
        setNodesToDelete([]);
        saveCanvas();
    };

    const cancelDelete = () => {
        setDeleteModalOpen(false);
        setNodesToDelete([]);
    };

    // Keyboard Shortcuts for Undo/Redo
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault();
                if (e.shiftKey) {
                    const next = redo(nodes, edges);
                    if (next) { setNodes(next.nodes); setEdges(next.edges); }
                } else {
                    const prev = undo(nodes, edges);
                    if (prev) { setNodes(prev.nodes); setEdges(prev.edges); }
                }
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
                e.preventDefault();
                const next = redo(nodes, edges);
                if (next) { setNodes(next.nodes); setEdges(next.edges); }
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [nodes, edges, undo, redo, setNodes, setEdges]);

    // RF Instance for Drag & Drop mapping
    const [rfInstance, setRfInstance] = useState(null);

    const onDragOver = useCallback((event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
    }, []);

    const onDrop = useCallback((event) => {
        event.preventDefault();

        const dataStr = event.dataTransfer.getData('application/reactflow-citation');
        if (!dataStr || !rfInstance) return;

        const citationData = JSON.parse(dataStr);

        // Use rfInstance's screenToFlowPosition to translate viewport coordinates into canvas coordinates
        const position = rfInstance.screenToFlowPosition({
            x: event.clientX,
            y: event.clientY,
        });

        const newNodeId = `citation_${Date.now()}`;
        const newNode = {
            id: newNodeId,
            type: 'citationCard',
            position,
            data: {
                source: citationData.source,
                snippet: citationData.snippet
            },
        };

        const newEdge = {
            id: `e-${citationData.parentId}-${newNodeId}`,
            source: citationData.parentId,
            target: newNodeId,
            animated: true,
            style: { stroke: 'rgba(0, 148, 54, 0.4)', strokeWidth: 2 }
        };

        takeSnapshot(nodes, edges);
        setNodes((nds) => nds.concat(newNode));
        setEdges((eds) => eds.concat(newEdge));
    }, [rfInstance, nodes, edges, takeSnapshot, setNodes, setEdges]);

    // Grid Snapping State
    const [isGridSnapping, setIsGridSnapping] = useState(true);

    const handleAddCard = () => {
        if (!rfInstance) return;

        // Calculate center of screen
        const centerPosition = rfInstance.screenToFlowPosition({
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
        });

        // Offset slightly if there are multiple cards to avoid perfectly obscuring
        const spawnX = centerPosition.x - 175; // Half of approx card width
        const spawnY = centerPosition.y - 125; // Half of approx card height

        const newNodeId = `report-${Date.now()}`;
        const newNode = {
            id: newNodeId,
            type: 'reportCard',
            position: { x: spawnX, y: spawnY },
            data: {
                title: 'New Insight Card',
                summary: 'Double click to edit this summary. Add your own custom research points here.',
                citations: []
            },
        };

        takeSnapshot(nodes, edges);
        setNodes((nds) => nds.map(n => ({ ...n, selected: false })).concat({ ...newNode, selected: true }));
        saveCanvas();
    };

    // Grouping
    const selectedNodes = nodes.filter(n => n.selected && !n.parentNode);

    const handleGroupSelected = () => {
        if (selectedNodes.length < 2) return;
        takeSnapshot(nodes, edges);

        const pad = 40;
        const minX = Math.min(...selectedNodes.map(n => n.position.x)) - pad;
        const minY = Math.min(...selectedNodes.map(n => n.position.y)) - pad - 40;

        // Approximate sizing based on worst-case internal card dims
        const maxX = Math.max(...selectedNodes.map(n => n.position.x + 350)) + pad;
        const maxY = Math.max(...selectedNodes.map(n => n.position.y + 250)) + pad;

        const groupId = `group-${Date.now()}`;

        const groupNode = {
            id: groupId,
            type: 'groupCard',
            position: { x: minX, y: minY },
            style: { width: maxX - minX, height: maxY - minY },
            data: { title: 'New Insight Group', width: maxX - minX, height: maxY - minY },
            zIndex: -1,
        };

        const updatedNodes = nodes.map(n => {
            if (selectedNodes.find(sn => sn.id === n.id)) {
                return {
                    ...n,
                    parentNode: groupId,
                    position: { x: n.position.x - minX, y: n.position.y - minY },
                    selected: false
                };
            }
            return n;
        });

        setNodes([...updatedNodes, groupNode]);
        saveCanvas();
    };

    return (
        <ReactFlowProvider>
            <div className="canvas-container">
                {/* Save status indicator */}
                {saveStatus && (
                    <div style={{
                        position: 'absolute', top: '24px', right: '24px', zIndex: 10,
                        padding: '6px 14px', borderRadius: '8px', fontSize: '13px',
                        fontWeight: 500, backdropFilter: 'blur(10px)',
                        background: saveStatus === 'conflict'
                            ? 'rgba(239,68,68,0.12)'
                            : 'rgba(0,148,54,0.12)',
                        color: saveStatus === 'conflict' ? '#ef4444' : '#009436',
                        border: `1px solid ${saveStatus === 'conflict' ? 'rgba(239,68,68,0.3)' : 'rgba(0,148,54,0.3)'}`,
                        boxShadow: '0 4px 12px rgba(2,6,23,0.08)',
                        transition: 'opacity 0.3s',
                    }}>
                        {saveStatus === 'conflict' ? '⚠ Conflict — canvas refreshed from server' : '✓ Saved'}
                    </div>
                )}

                {/* Back Button */}
                {onBack && (
                    <div style={{ position: 'absolute', top: '24px', left: '24px', zIndex: 10 }}>
                        <button className="btn btn-secondary" onClick={onBack} style={{ padding: '8px 14px', fontSize: '13px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px', height: '34px', background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.6)', boxShadow: '0 4px 12px rgba(2, 6, 23, 0.08)' }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px' }}>
                                <path d="M19 12H5"></path>
                                <polyline points="12 19 5 12 12 5"></polyline>
                            </svg>
                            Exit Workspace
                        </button>
                    </div>
                )}

                {/* Custom Control Bar */}
                <div className="canvas-header-controls">
                    <div className="control-group" style={{ borderRight: '1px solid rgba(15,23,42,0.1)', paddingRight: '16px' }}>
                        <button className="btn btn-primary" style={{ padding: '8px 14px', fontSize: '14px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={handleAddCard}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px' }}>
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            Add Card
                        </button>
                    </div>

                    {selectedNodes.length > 1 && (
                        <div className="control-group" style={{ borderRight: '1px solid rgba(15,23,42,0.1)', paddingRight: '16px' }}>
                            <button className="btn btn-primary" style={{ padding: '8px 14px', fontSize: '14px', borderRadius: '8px' }} onClick={handleGroupSelected}>
                                Group ({selectedNodes.length})
                            </button>
                        </div>
                    )}
                    <div className="control-group" style={{ gap: '8px', borderRight: '1px solid rgba(15,23,42,0.1)', paddingRight: '16px' }}>
                        <button
                            className="action-icon-btn"
                            onClick={() => { const prev = undo(nodes, edges); if (prev) { setNodes(prev.nodes); setEdges(prev.edges); } }}
                            disabled={!canUndo}
                            style={{ opacity: canUndo ? 1 : 0.4, padding: '6px', height: '32px', width: '32px', display: 'grid', placeItems: 'center' }}
                            title="Undo (Ctrl+Z)"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '18px', height: '18px' }}>
                                <path d="M3 7v6h6"></path>
                                <path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13"></path>
                            </svg>
                        </button>
                        <button
                            className="action-icon-btn"
                            onClick={() => { const next = redo(nodes, edges); if (next) { setNodes(next.nodes); setEdges(next.edges); } }}
                            disabled={!canRedo}
                            style={{ opacity: canRedo ? 1 : 0.4, padding: '6px', height: '32px', width: '32px', display: 'grid', placeItems: 'center' }}
                            title="Redo (Ctrl+Y)"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '18px', height: '18px' }}>
                                <path d="M21 7v6h-6"></path>
                                <path d="M3 17a9 9 0 019-9 9 9 0 016 2.3l3 2.7"></path>
                            </svg>
                        </button>
                    </div>
                    <div className="control-group">
                        <label className="toggle-label" style={{ margin: 0 }}>
                            <span className="toggle-text" style={{ fontSize: '13px' }}>Snap Grid</span>
                            <div className={`toggle-switch ${isGridSnapping ? 'active' : ''}`} onClick={() => setIsGridSnapping(!isGridSnapping)} style={{ transform: 'scale(0.9)' }}>
                                <div className="toggle-knob"></div>
                            </div>
                        </label>
                    </div>
                </div>

                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onNodeDragStart={onNodeDragStart}
                    onNodeDragStop={onNodeDragStop}
                    onNodesDelete={onNodesDelete}
                    nodeTypes={nodeTypes}
                    onInit={setRfInstance}
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    snapToGrid={isGridSnapping}
                    snapGrid={[20, 20]}
                    fitView
                    attributionPosition="bottom-left"
                    minZoom={0.2}
                    maxZoom={2}
                    style={{ width: '100%', height: '100%' }}
                >
                    <Background color="#0f172a" gap={20} size={1} opacity={0.1} />
                    <Controls
                        style={{
                            boxShadow: '0 10px 24px rgba(2, 6, 23, .08)',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            border: '1px solid rgba(15,23,42,0.1)'
                        }}
                    />
                    <MiniMap
                        nodeColor={(n) => {
                            if (n.type === 'groupCard') return 'rgba(15, 23, 42, 0.1)';
                            return 'rgba(0, 148, 54, 0.4)';
                        }}
                        nodeBorderRadius={8}
                        style={{
                            borderRadius: '16px',
                            border: '1px solid rgba(15,23,42,0.1)',
                            boxShadow: '0 10px 24px rgba(2, 6, 23, .08)'
                        }}
                    />
                </ReactFlow>

                <Modal
                    isOpen={deleteModalOpen}
                    onClose={cancelDelete}
                    title="Confirm Deletion"
                >
                    <p style={{ margin: '0 0 20px 0', fontSize: '15px', color: 'rgba(15,23,42,0.8)', lineHeight: 1.5 }}>
                        Are you sure you want to delete the selected items from the canvas? This will also remove any connected citations.
                    </p>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                        <button className="btn btn-secondary" onClick={cancelDelete}>
                            Cancel
                        </button>
                        <button className="btn btn-primary" style={{ background: '#ef4444' }} onClick={confirmDelete}>
                            Delete Permanently
                        </button>
                    </div>
                </Modal>
            </div>
        </ReactFlowProvider>
    );
};

export default WorkspaceCanvas;
