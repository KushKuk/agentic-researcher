import React, { useEffect } from 'react';
import '../../styles/global.css';

const Toast = ({ show, title, desc, onClose }) => {
    useEffect(() => {
        let timer;
        if (show) {
            timer = setTimeout(() => {
                onClose();
            }, 3200);
        }
        return () => clearTimeout(timer);
    }, [show, onClose]);

    if (!show) return null;

    return (
        <div
            className={`toast ${show ? 'show' : ''}`}
            role="status"
            aria-live="polite"
            aria-label="Status message"
        >
            <div className="ticon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                    <path d="M12 2l1.2 4.2L17 7.4l-3.8 1.2L12 13l-1.2-4.4L7 7.4l3.8-1.2L12 2Z"></path>
                </svg>
            </div>
            <div className="tcopy">
                <p className="ttitle">{title}</p>
                <p className="tdesc">{desc}</p>
            </div>
            <button className="tclose" type="button" onClick={onClose} aria-label="Dismiss">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M18 6 6 18"></path>
                    <path d="M6 6l12 12"></path>
                </svg>
            </button>
        </div>
    );
};

export default Toast;
