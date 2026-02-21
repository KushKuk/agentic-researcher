import React, { useState, useEffect, useRef } from 'react';
import { Handle, Position, useReactFlow, NodeResizer } from '@xyflow/react';
import CitationSubCard from './CitationSubCard';
import InlineChatButton from './InlineChatButton';
import '../../styles/global.css';

const ReportNodeCard = ({ id, data, isConnectable, selected }) => {
    const { getNode, setNodes, setCenter } = useReactFlow();

    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [isEditingSummary, setIsEditingSummary] = useState(false);
    const [editedTitle, setEditedTitle] = useState(data.title);
    const [editedSummary, setEditedSummary] = useState(data.summary);

    const titleInputRef = useRef(null);
    const summaryInputRef = useRef(null);

    // Sync state if external changes happen
    useEffect(() => {
        setEditedTitle(data.title);
        setEditedSummary(data.summary);
    }, [data.title, data.summary]);

    // Focus immediately when editing natively
    useEffect(() => {
        if (isEditingTitle && titleInputRef.current) titleInputRef.current.focus();
    }, [isEditingTitle]);

    useEffect(() => {
        if (isEditingSummary && summaryInputRef.current) summaryInputRef.current.focus();
    }, [isEditingSummary]);

    const commitTitleChange = () => {
        setIsEditingTitle(false);
        setNodes((nds) => nds.map((n) => n.id === id ? { ...n, data: { ...n.data, title: editedTitle } } : n));
    };

    const commitSummaryChange = () => {
        setIsEditingSummary(false);
        setNodes((nds) => nds.map((n) => n.id === id ? { ...n, data: { ...n.data, summary: editedSummary } } : n));
    };

    const handleDuplicate = () => {
        const currentNode = getNode(id);
        if (!currentNode) return;

        const newX = currentNode.position.x + 50;
        const newY = currentNode.position.y + 50;

        const newNode = {
            id: `${currentNode.id}-clone-${Date.now()}`,
            type: currentNode.type,
            position: { x: newX, y: newY },
            data: { ...currentNode.data },
            selected: true,
            zIndex: currentNode.zIndex || 0,
        };

        setNodes((nds) =>
            nds.map((n) => ({ ...n, selected: false })).concat(newNode)
        );

        // Auto-pan to the new node smoothly
        requestAnimationFrame(() => {
            setCenter(newX + 180, newY + 150, { zoom: 1, duration: 600 });
        });
    };

    const handleBringForward = () => {
        setNodes((nds) => nds.map((n) => {
            if (n.id === id) {
                return { ...n, zIndex: (n.zIndex || 0) + 1 };
            }
            return n;
        }));
    };

    const handleSendBackward = () => {
        setNodes((nds) => nds.map((n) => {
            if (n.id === id) {
                return { ...n, zIndex: Math.max((n.zIndex || 0) - 1, 0) };
            }
            return n;
        }));
    };

    return (
        <div
            className="report-node-card glass-panel"
            style={{
                width: '100%',
                height: '100%',
                minWidth: '320px',
                minHeight: '200px'
            }}
        >
            <NodeResizer
                color="#009436"
                isVisible={selected}
                minWidth={320}
                minHeight={200}
            />

            <Handle type="target" position={Position.Top} isConnectable={isConnectable} className="custom-handle" />

            <div className="node-header" style={{ justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="node-icon">
                        {data.icon || (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                <line x1="3" y1="9" x2="21" y2="9" />
                                <line x1="9" y1="21" x2="9" y2="9" />
                            </svg>
                        )}
                    </div>
                    {isEditingTitle ? (
                        <input
                            ref={titleInputRef}
                            className="node-title-input"
                            style={{
                                fontSize: '15px', fontWeight: '700', border: '1px solid var(--primary)',
                                borderRadius: '6px', padding: '2px 6px', background: 'rgba(255,255,255,0.9)',
                                outline: 'none', width: '100%'
                            }}
                            value={editedTitle}
                            onChange={(e) => setEditedTitle(e.target.value)}
                            onBlur={commitTitleChange}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === 'Escape') commitTitleChange();
                            }}
                        />
                    ) : (
                        <div
                            className="node-title"
                            style={{ cursor: 'text' }}
                            onDoubleClick={() => setIsEditingTitle(true)}
                            title="Double-click to edit"
                        >
                            {data.title}
                        </div>
                    )}
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                        className="action-icon-btn"
                        onClick={handleSendBackward}
                        title="Send Backward"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px' }}>
                            <path d="M12 19V5M5 12l7 7 7-7" />
                        </svg>
                    </button>
                    <button
                        className="action-icon-btn"
                        onClick={handleBringForward}
                        title="Bring Forward"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px' }}>
                            <path d="M12 5v14M5 12l7-7 7 7" />
                        </svg>
                    </button>
                    <button
                        className="action-icon-btn"
                        onClick={handleDuplicate}
                        title="Duplicate"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px' }}>
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                    </button>
                </div>
            </div>

            <div className="node-body">
                {isEditingSummary ? (
                    <textarea
                        ref={summaryInputRef}
                        className="node-summary-input"
                        style={{
                            width: '100%', minHeight: '80px', fontSize: '14px', lineHeight: '1.5',
                            border: '1px solid rgba(15,23,42,0.2)', borderRadius: '8px', padding: '8px',
                            background: 'rgba(255,255,255,0.9)', outline: 'none', resize: 'vertical',
                            fontFamily: 'inherit', color: 'var(--text)'
                        }}
                        value={editedSummary}
                        onChange={(e) => setEditedSummary(e.target.value)}
                        onBlur={commitSummaryChange}
                        onKeyDown={(e) => {
                            if (e.key === 'Escape') commitSummaryChange();
                        }}
                    />
                ) : (
                    <div
                        className="node-summary"
                        style={{ cursor: 'text' }}
                        onDoubleClick={() => setIsEditingSummary(true)}
                        title="Double-click to edit"
                    >
                        {data.summary}
                    </div>
                )}

                {data.citations && data.citations.length > 0 && (
                    <div className="node-citations">
                        <div className="citations-label">Sources & Citations</div>
                        {data.citations.map((cite, idx) => (
                            <CitationSubCard
                                key={idx}
                                parentId={id}
                                source={cite.source}
                                snippet={cite.snippet}
                            />
                        ))}
                    </div>
                )}
            </div>

            <InlineChatButton contextTitle={data.title} />

            <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} className="custom-handle" />
        </div>
    );
};

export default ReportNodeCard;
