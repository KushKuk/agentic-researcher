import React from 'react';
import '../../styles/global.css';

const RecentWorkspaces = ({ workspaces = [], onBrowseClick }) => {
    return (
        <aside className="panel" aria-label="Recent workspaces">
            <div className="panel-header">
                <div>
                    <p className="panel-title">Recent workspaces</p>
                    <p className="panel-sub">
                        {workspaces.length > 0
                            ? 'Pick up where you left off.'
                            : 'Nothing here yet — open one to get started.'}
                    </p>
                </div>

                <button
                    className="panel-action"
                    type="button"
                    onClick={onBrowseClick}
                    aria-label="Browse all workspaces"
                >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M10 6h10"></path>
                        <path d="M4 6h2"></path>
                        <path d="M10 12h10"></path>
                        <path d="M4 12h2"></path>
                        <path d="M10 18h10"></path>
                        <path d="M4 18h2"></path>
                    </svg>
                    Browse
                </button>
            </div>

            {workspaces.length === 0 ? (
                <div className="empty" aria-label="Empty state">
                    <div className="empty-illu" aria-hidden="true">
                        <svg viewBox="0 0 24 24">
                            <path d="M7 7h10"></path>
                            <path d="M7 12h10"></path>
                            <path d="M7 17h6"></path>
                            <path d="M6 3h9l3 3v15a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"></path>
                        </svg>
                    </div>

                    <div className="empty-copy">
                        <p className="empty-title">No recent workspaces</p>
                        <p className="empty-desc">
                            Create a new workspace for a clean start, or open an existing one to
                            continue where you left off.
                        </p>

                        <div className="hint-row" aria-label="Tips">
                            <div className="chip">
                                <svg viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M12 3v2"></path>
                                    <path d="M18.36 5.64l-1.41 1.41"></path>
                                    <path d="M21 12h-2"></path>
                                    <path d="M18.36 18.36l-1.41-1.41"></path>
                                    <path d="M12 21v-2"></path>
                                    <path d="M5.64 18.36l1.41-1.41"></path>
                                    <path d="M3 12h2"></path>
                                    <path d="M5.64 5.64l1.41 1.41"></path>
                                    <path d="M12 7a5 5 0 1 0 5 5"></path>
                                </svg>
                                Fast start
                            </div>
                            <div className="chip">
                                <svg viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M20 7l-8 8-4-4"></path>
                                    <path d="M4 7V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2"></path>
                                </svg>
                                Clean structure
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="recent-list">
                    {/* List implementation would go here */}
                    {workspaces.map((ws) => (
                        <div key={ws.id}>{ws.name}</div>
                    ))}
                </div>
            )}
        </aside>
    );
};

export default RecentWorkspaces;
