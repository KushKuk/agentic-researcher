import React from 'react';
import '../../styles/global.css';

const BottomNav = ({ activeTab, onTabChange }) => {
    const tabs = [
        {
            id: 'home',
            label: 'Home',
            icon: (
                <>
                    <path d="M3 10.5 12 3l9 7.5"></path>
                    <path d="M5 10v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V10"></path>
                    <path d="M10 22V14h4v8"></path>
                </>
            ),
        },
        {
            id: 'workspaces',
            label: 'Workspaces',
            icon: (
                <>
                    <path d="M4 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z"></path>
                    <path d="M8 13h8"></path>
                </>
            ),
        },
        {
            id: 'settings',
            label: 'Settings',
            icon: (
                <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z M19.4 15a7.9 7.9 0 0 0 .1-1 7.9 7.9 0 0 0-.1-1l2-1.5-2-3.5-2.4 1a8.2 8.2 0 0 0-1.7-1L15 3h-6l-.3 2.5a8.2 8.2 0 0 0-1.7 1l-2.4-1-2 3.5 2 1.5a7.9 7.9 0 0 0-.1 1 7.9 7.9 0 0 0 .1 1l-2 1.5 2 3.5 2.4-1a8.2 8.2 0 0 0 1.7 1L9 21h6l.3-2.5a8.2 8.2 0 0 0 1.7-1l2.4 1 2-3.5Z"></path>
            ),
        },
    ];

    return (
        <nav className="bottom-nav" aria-label="Bottom navigation">
            <div className="nav-surface">
                <div className="nav-row">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            className={`nav-item ${activeTab === tab.id ? 'is-active' : ''}`}
                            type="button"
                            onClick={() => onTabChange(tab.id)}
                            aria-label={tab.label}
                            aria-current={activeTab === tab.id ? 'page' : undefined}
                        >
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                                {tab.icon}
                            </svg>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </nav>
    );
};

export default BottomNav;
