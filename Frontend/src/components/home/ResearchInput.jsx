import React, { useState, useRef, useEffect } from 'react';
import '../../styles/global.css';

const ResearchInput = ({ onSubmit }) => {
    const [query, setQuery] = useState('');
    const inputRef = useRef(null);

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    const handleStart = () => {
        if (!query.trim()) return;
        console.log("Starting research for:", query);
        if (onSubmit) {
            onSubmit(query);
        }
    };

    return (
        <div className="research-input-container">
            <div className="research-input-wrapper">
                <textarea
                    ref={inputRef}
                    className="research-textarea"
                    placeholder="Describe what you want to research..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleStart();
                        }
                    }}
                />
                <button
                    className="research-submit-btn"
                    onClick={handleStart}
                    disabled={!query.trim()}
                    aria-label="Submit Research"
                >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M5 12h14"></path>
                        <path d="M12 5l7 7-7 7"></path>
                    </svg>
                </button>
            </div>

            <div className="research-options">
                <button className="option-chip active" type="button">
                    <svg viewBox="0 0 24 24"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                    Deep Research
                </button>
                <button className="option-chip" type="button">
                    <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
                    Web Results
                </button>
                <button className="option-chip" type="button">
                    <svg viewBox="0 0 24 24"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-0-0M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15" /></svg>
                    Academic Docs
                </button>
            </div>
        </div>
    );
};

export default ResearchInput;
