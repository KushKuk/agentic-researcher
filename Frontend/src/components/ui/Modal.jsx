import React, { useEffect, useRef } from 'react';
import '../../styles/global.css';

const Modal = ({ isOpen, onClose, title, children, initialFocusRef }) => {
    const modalRef = useRef(null);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            document.body.style.overflow = 'hidden';
            document.addEventListener('keydown', handleKeyDown);
            // Slight delay for animation and focus
            setTimeout(() => {
                if (initialFocusRef && initialFocusRef.current) {
                    initialFocusRef.current.focus();
                }
            }, 120);
        } else {
            document.body.style.overflow = '';
            document.removeEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.body.style.overflow = '';
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose, initialFocusRef]);

    if (!isOpen) return null;

    return (
        <div
            className={`modal-overlay ${isOpen ? 'open' : ''}`}
            role="dialog"
            aria-modal="true"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="modal" ref={modalRef}>
                <div className="modal-head">
                    <div>
                        <p className="modal-title">{title}</p>
                        <p className="modal-sub">
                            Name it now — you can change it later. This is a quick preview before navigating.
                        </p>
                    </div>
                    <button className="close-btn" type="button" onClick={onClose} aria-label="Close modal">
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M18 6 6 18"></path>
                            <path d="M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>

                <div className="modal-body">{children}</div>
            </div>
        </div>
    );
};

export default Modal;
