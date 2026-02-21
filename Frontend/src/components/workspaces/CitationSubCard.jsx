import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useReactFlow } from '@xyflow/react';
import '../../styles/global.css';

const CitationSubCard = ({ parentId, source, snippet }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isPinned, setIsPinned] = useState(false);
    const wrapperRef = useRef(null);
    const [popupStyle, setPopupStyle] = useState({});

    // Grab the React Flow instance so we can programmatically add nodes
    const { getNode, setNodes, setEdges } = useReactFlow();

    // Attempt to parse out just the section/page prefix from the snippet
    const sectionPrefix = snippet ? snippet.split(':')[0] : '';
    const displaySnippet = sectionPrefix.length < 25 ? sectionPrefix : 'Summary';

    const isExpanded = isHovered || isPinned;

    useEffect(() => {
        // Calculate the absolute viewport coordinates of the citation badge wrapper
        // to render the floating tooltip exactly hovering over it, escaping React Flow boundaries.
        if (isExpanded && wrapperRef.current) {
            const updatePosition = () => {
                const rect = wrapperRef.current.getBoundingClientRect();
                setPopupStyle({
                    position: 'fixed',
                    bottom: window.innerHeight - rect.top + 8,
                    left: rect.left + rect.width / 2,
                    transform: 'translate(-50%, 0)',
                    zIndex: 99999,
                });
            };

            updatePosition();

            // Re-calculate on scroll or resize just in case
            window.addEventListener('scroll', updatePosition, true);
            window.addEventListener('resize', updatePosition);

            return () => {
                window.removeEventListener('scroll', updatePosition, true);
                window.removeEventListener('resize', updatePosition);
            };
        }
    }, [isExpanded]);

    const popupContent = isExpanded ? (
        <div
            className="citation-popup-card"
            style={popupStyle}
            onClick={(e) => e.stopPropagation()}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="citation-popup-header">
                <span className="citation-popup-title">{source}</span>
                {isPinned && (
                    <div style={{ display: 'flex', gap: '6px', marginLeft: 'auto' }}>
                        <button
                            className="btn btn-primary"
                            style={{ padding: '2px 8px', fontSize: '11px', borderRadius: '4px', lineHeight: '1.2', height: 'fit-content' }}
                            title="Extract as independent card"
                            onClick={(e) => {
                                e.stopPropagation();

                                // Get the parent node's location to spawn nearby
                                const parentNode = getNode(parentId);
                                if (parentNode) {
                                    // ReactFlow v11+ uses .measured.width or .width
                                    const nodeWidth = parentNode.measured?.width || parentNode.width || 350;
                                    const spawnX = parentNode.position.x + nodeWidth + 40;
                                    const spawnY = parentNode.position.y;

                                    const newNodeId = `citation_${Date.now()}`;
                                    const newNode = {
                                        id: newNodeId,
                                        type: 'citationCard',
                                        position: { x: spawnX, y: spawnY },
                                        data: { source, snippet },
                                    };

                                    const newEdge = {
                                        id: `e-${parentId}-${newNodeId}`,
                                        source: parentId,
                                        target: newNodeId,
                                        animated: true,
                                        style: { stroke: 'rgba(0, 148, 54, 0.4)', strokeWidth: 2 }
                                    };

                                    // Make the canvas state update
                                    setNodes((nds) => nds.concat(newNode));
                                    setEdges((eds) => eds.concat(newEdge));
                                }

                                // Close the popup after extracting
                                setIsPinned(false);
                                setIsHovered(false);
                            }}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '12px', height: '12px', marginRight: '4px', verticalAlign: 'text-bottom' }}>
                                <line x1="22" y1="2" x2="11" y2="13"></line>
                                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                            </svg>
                            Extract
                        </button>

                        <button
                            className="citation-close-btn"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsPinned(false);
                                setIsHovered(false);
                            }}
                            title="Close snippet"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                )}
            </div>
            <div className="citation-popup-body">
                "{snippet}"
            </div>
        </div>
    ) : null;

    const onDragStart = (event) => {
        event.dataTransfer.setData('application/reactflow-citation', JSON.stringify({ parentId, source, snippet }));
        event.dataTransfer.effectAllowed = 'copy';
    };

    return (
        <div
            className="citation-wrapper"
            ref={wrapperRef}
            draggable
            onDragStart={onDragStart}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => {
                if (!isPinned) setIsPinned(true);
            }}
        >
            <div className={`citation-sub-card ${isPinned ? 'pinned' : ''}`} title={!isExpanded ? `${source}\n\n"${snippet}"` : undefined}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="citation-icon">
                    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-0-0M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15" />
                </svg>
                <span className="citation-text">
                    {source} - {displaySnippet}
                </span>
            </div>

            {popupContent && createPortal(popupContent, document.body)}
        </div>
    );
};

export default CitationSubCard;
