import React from 'react';
import '../../styles/global.css';

const WorkspacesPage = ({ workspaces, onCreateClick, onOpenWorkspace }) => {
    return (
        <div className="workspaces-container" style={{ padding: '0 4px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
            <div className="workspaces-header" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px'
            }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                    <h2 style={{
                        fontSize: '24px',
                        fontWeight: '700',
                        color: 'var(--accent)',
                        margin: 0,
                        letterSpacing: '-0.02em'
                    }}>Your Research</h2>
                    <span style={{
                        color: 'var(--muted)',
                        fontSize: '20px',
                        margin: 0
                    }}> - Manage and organize your topics.</span>
                </div>
            </div>
            <div>
                <button
                    className="btn btn-primary"
                    onClick={onCreateClick}
                    style={{ minHeight: '60px', padding: '0 16px', fontSize: '16px' }}
                >
                    <svg className="btn-icon" viewBox="0 0 24 24" style={{ width: '16px', height: '16px' }}>
                        <path d="M12 5v14"></path>
                        <path d="M5 12h14"></path>
                    </svg>
                    New Topic
                </button></div>

            {workspaces.length === 0 ? (
                <div className="empty-state" style={{
                    marginTop: '30px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '60px 20px',
                    background: 'rgba(255,255,255,0.5)',
                    borderRadius: 'var(--r-lg)',
                    border: '1px dashed var(--stroke)',
                    textAlign: 'center'
                }}>
                    <div className="empty-illu" style={{ marginBottom: '16px' }}>
                        <svg viewBox="0 0 24 24">
                            <path d="M7 7h10"></path>
                            <path d="M7 12h10"></path>
                            <path d="M7 17h6"></path>
                            <path d="M6 3h9l3 3v15a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"></path>
                        </svg>
                    </div>
                    <h3 style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: 'var(--accent)',
                        margin: '0 0 8px 0'
                    }}>No research topics yet</h3>
                    <p style={{
                        color: 'var(--muted)',
                        fontSize: '14px',
                        margin: 0,
                        maxWidth: '300px'
                    }}>Create a new topic to get started with your AI-powered research.</p>
                </div>
            ) : (
                <div className="workspaces-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '16px'
                }}>
                    {workspaces.map((ws) => (
                        <div key={ws.id} className="workspace-card" style={{
                            background: 'rgba(255,255,255,0.8)',
                            borderRadius: 'var(--r-md)',
                            border: '1px solid rgba(255,255,255,0.6)',
                            boxShadow: 'var(--shadow-sm)',
                            padding: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                            transition: 'transform var(--t), box-shadow var(--t)',
                            cursor: 'pointer',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                            onClick={() => onOpenWorkspace(ws.id)}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                            }}
                        >
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '12px',
                                background: 'linear-gradient(135deg, rgba(0,148,54,0.1), rgba(209,250,229,0.5))',
                                display: 'grid',
                                placeItems: 'center',
                                border: '1px solid rgba(0,148,54,0.1)'
                            }}>
                                <svg viewBox="0 0 24 24" style={{
                                    width: '20px',
                                    height: '20px',
                                    stroke: 'var(--primary)',
                                    fill: 'none',
                                    strokeWidth: 2
                                }}>
                                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                                </svg>
                            </div>
                            <div>
                                <h3 style={{
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    color: 'var(--accent)',
                                    margin: '0 0 4px 0',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                }}>{ws.name}</h3>
                                <p style={{
                                    fontSize: '13px',
                                    color: 'var(--muted)',
                                    margin: 0
                                }}>Last edited just now</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default WorkspacesPage;
