import React from 'react';
import '../../styles/global.css';

const AppLayout = ({ children }) => {
    return (
        <div className="app-container">
            <div className="shell">{children}</div>
        </div>
    );
};

export default AppLayout;
