import React, { useState } from 'react';
import '../../styles/global.css';

const ResearchSummary = ({ onEnterWorkspace }) => {
    const [chatInput, setChatInput] = useState('');

    const handleChatSubmit = (e) => {
        e.preventDefault();
        if (!chatInput.trim()) return;
        // Mock chat submission
        console.log('Chat message:', chatInput);
        setChatInput('');
    };

    return (
        <div className="summary-layout">

            {/* Left Column */}
            <div className="summary-col summary-left">

                <div className="summary-card">
                    <div className="card-header">
                        <div className="card-title">Authors</div>
                    </div>
                    <div className="card-body">
                        <ul className="author-list">
                            <li>
                                <a href="https://example.com/turing" className="author-link" target="_blank" rel="noopener noreferrer">
                                    <img src="https://ui-avatars.com/api/?name=Alan+Turing&background=random" alt="Alan Turing" className="author-avatar" />
                                    <span>Dr. Alan Turing</span>
                                </a>
                            </li>
                            <li>
                                <a href="https://example.com/lovelace" className="author-link" target="_blank" rel="noopener noreferrer">
                                    <img src="https://ui-avatars.com/api/?name=Ada+Lovelace&background=random" alt="Ada Lovelace" className="author-avatar" />
                                    <span>Ada Lovelace</span>
                                </a>
                            </li>
                            <li>
                                <a href="https://example.com/hopper" className="author-link" target="_blank" rel="noopener noreferrer">
                                    <img src="https://ui-avatars.com/api/?name=Grace+Hopper&background=random" alt="Grace Hopper" className="author-avatar" />
                                    <span>Grace Hopper</span>
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="summary-card flex-grow">
                    <div className="card-header">
                        <div className="card-title">Sources Analyzed</div>
                    </div>
                    <div className="card-body">
                        <div className="source-item">
                            <a href="https://nature.com/articles/qcomputing" className="source-link" target="_blank" rel="noopener noreferrer">
                                <div className="source-title">Quantum Computing: A New Era</div>
                                <div className="source-url">nature.com/articles/qcomputing</div>
                            </a>
                        </div>
                        <div className="source-item">
                            <a href="https://arxiv.org/abs/2109.12345" className="source-link" target="_blank" rel="noopener noreferrer">
                                <div className="source-title">Advances in Neural Networks</div>
                                <div className="source-url">arxiv.org/abs/2109.12345</div>
                            </a>
                        </div>
                        <div className="source-item">
                            <a href="https://sciencedirect.com/science/article/pii" className="source-link" target="_blank" rel="noopener noreferrer">
                                <div className="source-title">The Future of AI Research</div>
                                <div className="source-url">sciencedirect.com/science/article/pii</div>
                            </a>
                        </div>
                    </div>
                </div>

            </div>

            {/* Middle Column */}
            <div className="summary-col summary-main">
                <div className="summary-card flex-grow">
                    <div className="card-header">
                        <div className="card-title">Summary Report</div>
                    </div>
                    <div className="card-body report-content">
                        <h2>Executive Summary</h2>
                        <p>This report synthesizes the latest findings in advanced computing paradigms, highlighting critical intersections between quantum mechanics and deep learning architectures. Based on the selected sources, the trajectory of generative AI heavily implies a paradigm shift in the next decade, focusing on energy efficiency and algorithmic optimization.</p>

                        <h3>Key Findings</h3>
                        <ul>
                            <li><strong>Quantum Supremacy:</strong> Recent experiments show a 1000x speedup in specific cryptographic simulations.</li>
                            <li><strong>Neural Network Efficiency:</strong> New sparse-activation techniques reduce training costs by up to 40%.</li>
                            <li><strong>Hardware Scaling:</strong> The plateauing of Moore's Law necessitates research into neuromorphic computing chips.</li>
                        </ul>

                        <p>In conclusion, the integration of these disparate fields requires cross-disciplinary collaboration. The authors suggest establishing normalized benchmarks for assessing hybrid quantum-classical algorithms.</p>
                    </div>
                </div>
            </div>

            {/* Right Column */}
            <div className="summary-col summary-right">

                <button
                    className="btn btn-primary enter-workspace-btn"
                    onClick={onEnterWorkspace}
                >
                    <svg className="btn-icon" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M5 12h14"></path>
                        <path d="M12 5l7 7-7 7"></path>
                    </svg>
                    Enter Workspace
                </button>

                <div className="summary-card flex-grow chat-panel">
                    <div className="card-header">
                        <div className="card-title">Ask AI</div>
                    </div>

                    <div className="chat-history">
                        <div className="chat-bubble ai-bubble">
                            I've generated the summary. What specific aspect would you like to explore further?
                        </div>
                    </div>

                    <form className="chat-input-area" onSubmit={handleChatSubmit}>
                        <input
                            type="text"
                            className="chat-input"
                            placeholder="Ask a question..."
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                        />
                        <button type="submit" className="chat-send" disabled={!chatInput.trim()}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="22" y1="2" x2="11" y2="13"></line>
                                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                            </svg>
                        </button>
                    </form>
                </div>

            </div>

        </div>
    );
};

export default ResearchSummary;
