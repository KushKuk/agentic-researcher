import React, { useState } from 'react';

const GroupNodeCard = ({ data }) => {
    // Local state to toggle the visible boundary outline
    const [showBoundary, setShowBoundary] = useState(true);

    return (
        <div style={{
            width: data.width || 400,
            height: data.height || 400,
            background: showBoundary ? 'rgba(255, 255, 255, 0.03)' : 'transparent',
            border: showBoundary ? '2px dashed rgba(15, 23, 42, 0.2)' : '2px solid transparent',
            borderRadius: '16px',
            position: 'relative',
            pointerEvents: 'none', // let clicks pass through to child nodes unless clicking the header
            transition: 'all 0.3s ease'
        }}>
            <div
                className="group-header"
                style={{
                    position: 'absolute',
                    top: '-40px',
                    left: '0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    pointerEvents: 'auto', // reactivate clicks for the header controls
                    background: 'rgba(255, 255, 255, 0.5)',
                    backdropFilter: 'blur(8px)',
                    padding: '6px 16px',
                    borderRadius: '20px',
                    border: '1px solid rgba(255,255,255,0.4)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                }}
            >
                <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--accent)' }}>
                    {data.title || 'Insight Group'}
                </div>

                <label className="toggle-label" style={{ margin: 0 }}>
                    <div className={`toggle-switch ${showBoundary ? 'active' : ''}`} onClick={() => setShowBoundary(!showBoundary)}>
                        <div className="toggle-knob"></div>
                    </div>
                </label>
            </div>
        </div>
    );
};

export default GroupNodeCard;
