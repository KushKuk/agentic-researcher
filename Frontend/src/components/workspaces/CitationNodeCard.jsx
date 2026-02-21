import React from 'react';
import { Handle, Position } from '@xyflow/react';
import InlineChatButton from './InlineChatButton';
import '../../styles/global.css';

const CitationNodeCard = ({ id, data, isConnectable }) => {
    return (
        <div className="citation-node-card glass-panel" style={{ width: 320, padding: 0, overflow: 'hidden' }}>
            <Handle type="target" position={Position.Left} isConnectable={isConnectable} className="custom-handle" />

            <div className="citation-popup-header" style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.5)' }}>
                <span className="citation-popup-title">{data.source}</span>
            </div>

            <div className="citation-popup-body" style={{ padding: '12px' }}>
                "{data.snippet}"
            </div>

            <InlineChatButton contextTitle={data.source} />

            <Handle type="source" position={Position.Right} isConnectable={isConnectable} className="custom-handle" />
        </div>
    );
};

export default CitationNodeCard;
