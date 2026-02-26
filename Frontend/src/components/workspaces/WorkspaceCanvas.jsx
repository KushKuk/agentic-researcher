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

// Workspace ID acts as the unique identifier for fetching backend state.
const WorkspaceCanvas = ({ onBack, workspaceId }) => {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState(false);
    const [metadata, setMetadata] = useState(null);
    const workspaceIdRef = useRef(workspaceId);

    useEffect(() => {
        workspaceIdRef.current = workspaceId;
    }, [workspaceId]);

    // History Hook
    const { takeSnapshot, undo, redo, canUndo, canRedo } = useHistory();

    // ── State for Autosave & Network ───────────────────────────────────────
    const [isSaving, setIsSaving] = useState(false);
    const [hasPendingSave, setHasPendingSave] = useState(false);
    const [saveStatus, setSaveStatus] = useState(null); // 'saved' | 'conflict' | null

    const versionRef = useRef(undefined);
    const latestStateRef = useRef({ nodes: [], edges: [], version: versionRef.current });
    const isSavingRef = useRef(false);
    const hasPendingRef = useRef(false);

    // ── Hydration ─────────────────────────────────────────────────────────
    useEffect(() => {
        setNodes([]);
        setEdges([]);
        versionRef.current = undefined;
        isSavingRef.current = false;
        hasPendingRef.current = false;
        setSaveStatus(null);
        setMetadata(null);
        setFetchError(false);
        setIsLoading(true);

        if (!workspaceId) {
            setIsLoading(false);
            return;
        }

        const abortController = new AbortController();

        const fetchCanvas = async () => {
            try {
                const res = await fetch(`/api/workspaces/${workspaceId}/canvas`, {
                    signal: abortController.signal,
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include'
                });

                if (!res.ok) throw new Error('Failed to fetch canvas');

                const json = await res.json();

                setNodes(json.data.nodes || []);
                setEdges(json.data.edges || []);
                versionRef.current = json.data.version;
                if (json.metadata) setMetadata(json.metadata);
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('Canvas hydration error:', err);
                    setFetchError(true);
                }
            } finally {
                if (!abortController.signal.aborted) {
                    setIsLoading(false);
                }
            }
        };

        fetchCanvas();

        return () => {
            abortController.abort();
        };
    }, [workspaceId, setNodes, setEdges]);

    // ── Autosave: single-slot queue model ──────────────────────────────────
    const saveCanvas = useCallback(async () => {
        if (isLoading) return;
        if (typeof versionRef.current !== 'number') return;
        if (!workspaceId) return;
        if (workspaceId !== workspaceIdRef.current) return;

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
                versionRef.current = json.data.version;
                if (json.metadata) setMetadata(json.metadata);
                setSaveStatus('saved');
                setTimeout(() => setSaveStatus(null), 2000);
            } else if (res.status === 409) {
                // 409 Conflict: Structural version alignment, immediately retry local draft
                versionRef.current = json.data.version;

                // Do NOT invoke setNodes(json.data.nodes) unless strictly necessary, 
                // the local latestStateRef represents user's intended state (Last-Write-Wins).

                setSaveStatus('conflict');
                setTimeout(() => setSaveStatus(null), 3000);

                // Queue another save immediately to overwrite server with local draft
                hasPendingRef.current = true;
                setHasPendingSave(true);
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
    }, [workspaceId, isLoading]); // setNodes/setEdges are stable refs from useNodesState/useEdgesState

    // Keep latestStateRef in sync on every render (no extra re-render cost)
    useEffect(() => {
        latestStateRef.current = { nodes, edges, version: versionRef.current };
    });

    // Debounced autosave — fires 800ms after nodes/edges settle
    useEffect(() => {
        const timer = setTimeout(() => {
            if (!isLoading) saveCanvas();
        }, 800);
        return () => clearTimeout(timer);
    }, [nodes, edges, saveCanvas, isLoading]);

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
                {fetchError ? (
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(248, 250, 252, 0.7)', backdropFilter: 'blur(4px)' }}>
                        <div style={{ padding: '16px 24px', background: '#fef2f2', border: '1px solid #f87171', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontWeight: 500, color: '#991b1b', display: 'flex', alignItems: 'center' }}>
                            ⚠ Failed to load workspace. Please refresh the page.
                        </div>
                    </div>
                ) : isLoading ? (
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(248, 250, 252, 0.7)', backdropFilter: 'blur(4px)' }}>
                        <div style={{ padding: '16px 24px', background: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontWeight: 500, color: 'var(--text)', display: 'flex', alignItems: 'center' }}>
                            <svg className="spinner" style={{ width: '20px', height: '20px', marginRight: '10px', animation: 'spin 1s linear infinite' }} viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="2" x2="12" y2="6"></line>
                                <line x1="12" y1="18" x2="12" y2="22"></line>
                                <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                                <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                                <line x1="2" y1="12" x2="6" y2="12"></line>
                                <line x1="18" y1="12" x2="22" y2="12"></line>
                                <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                                <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
                            </svg>
                            <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
                            Loading workspace...
                        </div>
                    </div>
                ) : (
                    <>
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

                        {metadata && (
                            <div style={{ position: 'absolute', bottom: '16px', right: '16px', zIndex: 10, fontSize: '11px', color: 'rgba(15,23,42,0.6)', background: 'rgba(255,255,255,0.7)', padding: '4px 8px', borderRadius: '4px', backdropFilter: 'blur(4px)', border: '1px solid rgba(15,23,42,0.1)' }}>
                                Last updated {new Date(metadata.updatedAt).toLocaleTimeString()}
                            </div>
                        )}
                    </>
                )}

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
        </ReactFlowProvider >
    );
};

export default WorkspaceCanvas;
