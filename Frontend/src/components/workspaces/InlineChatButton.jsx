import React, { useState, useRef, useEffect } from 'react';
import '../../styles/global.css';

const InlineChatButton = ({ contextTitle }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [prompt, setPrompt] = useState("");
    const inputRef = useRef(null);

    // Auto focus on expand
    useEffect(() => {
        if (isExpanded && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isExpanded]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!prompt.trim()) return;

        console.log(`[Chat Action] Discussing context '${contextTitle}' with prompt:`, prompt);
        // Normally hook into global AI handler here.
        setPrompt("");
    };

    return (
        <div className={`inline-chat-container ${isExpanded ? 'expanded' : ''}`}>
            {!isExpanded ? (
                <button
                    className="inline-chat-trigger"
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsExpanded(true);
                    }}
                    title="Discuss this card"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="sparkle-icon">
                        <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"></path>
                    </svg>
                </button>
            ) : (
                <form
                    className="inline-chat-form"
                    onSubmit={handleSubmit}
                    onClick={(e) => e.stopPropagation()}
                >
                    <input
                        ref={inputRef}
                        type="text"
                        className="inline-chat-input"
                        placeholder={`Discuss "${contextTitle}"...`}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onBlur={() => {
                            if (!prompt.trim()) setIsExpanded(false);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Escape') setIsExpanded(false);
                        }}
                    />
                    <button type="submit" className="inline-chat-submit" disabled={!prompt.trim()}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="22" y1="2" x2="11" y2="13"></line>
                            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                        </svg>
                    </button>
                </form>
            )}
        </div>
    );
};

export default InlineChatButton;
