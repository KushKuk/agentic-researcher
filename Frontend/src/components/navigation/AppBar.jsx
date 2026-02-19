import React from 'react';
import '../../styles/global.css';

const AppBar = ({ title, subtitle, onHelpClick }) => {
    return (
        <header className="app-bar" aria-label="App bar">
            <div className="brand">
                <div className="logo-wrap" aria-hidden="true">
                    <img
                        src="https://cobekartus.sirv.com/Images/logoipsum-368.png"
                        alt={`${title} logo`}
                    />
                </div>
                <div className="title-block">
                    <div className="app-title">{title}</div>
                    <div className="app-subtitle">{subtitle}</div>
                </div>
            </div>

            <div className="bar-actions">
                <button
                    className="icon-btn"
                    type="button"
                    onClick={onHelpClick}
                    aria-label="Quick tips"
                >
                    <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M12 18h.01"></path>
                        <path d="M9.09 9a3 3 0 1 1 5.82 1c0 2-3 2-3 4"></path>
                        <path d="M12 22a10 10 0 1 0-10-10 10 10 0 0 0 10 10Z"></path>
                    </svg>
                </button>
            </div>
        </header>
    );
};

export default AppBar;
