import React from 'react';
import '../../styles/landing.css';

const LandingPage = ({ onEnter }) => {
    return (
        <div className="landing-page">
            <div className="landing-nav-wrapper">
                <nav className="landing-nav">
                    <div className="landing-logo">
                        <div className="landing-logo-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        </div>
                        Clarity
                    </div>
                    <div className="landing-nav-links">
                        <a href="#product">Product</a>
                        <a href="#research">Research</a>
                        <a href="#pricing">Pricing</a>
                        <a href="#blog">Blog</a>
                    </div>
                    <div className="landing-nav-actions">
                        <button className="btn-text" onClick={onEnter}>Sign In</button>
                        <button className="btn-primary landing-btn-sm" onClick={onEnter}>Get Started <span style={{ marginLeft: '4px' }}>→</span></button>
                    </div>
                </nav>
            </div>

            <main className="landing-hero">
                <div className="landing-badge">
                    <span className="dot"></span> AI Research Assistant - Now in Public Beta <span className="badge-new">NEW</span>
                </div>
                <h1 className="landing-title">
                    Start fast.<br />
                    <span className="text-green">Stay organized.</span>
                </h1>
                <p className="landing-subtitle">
                    The ultimate AI-powered workspace for your research. Collect,
                    synthesize, and connect your thoughts in an <strong>infinite spatial canvas</strong>.
                </p>
                <div className="landing-cta-group">
                    <button className="btn-primary landing-btn-lg" onClick={onEnter}>
                        Start Researching <span style={{ marginLeft: '6px' }}>→</span>
                    </button>
                    <button className="btn-outline landing-btn-lg" onClick={onEnter}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '18px', height: '18px', marginRight: '8px' }}>
                            <circle cx="12" cy="12" r="10"></circle>
                            <polygon points="10 8 16 12 10 16 10 8"></polygon>
                        </svg>
                        Watch Demo
                    </button>
                </div>

                <div className="landing-social-proof">
                    <div className="avatars">
                        <div className="avatar a1">A</div>
                        <div className="avatar a2">B</div>
                        <div className="avatar a3">C</div>
                        <div className="avatar a4">D</div>
                    </div>
                    <span><strong>2,400+</strong> researchers already using Clarity</span>
                </div>

                <div className="landing-mockup">
                    <div className="mockup-header">
                        <div className="mockup-dots">
                            <span className="r"></span><span className="y"></span><span className="g"></span>
                        </div>
                        <div className="mockup-url">clarity.app/canvas/my-research</div>
                        <div className="mockup-actions">
                            <span>Share</span>
                            <span>Export</span>
                        </div>
                    </div>
                    <div className="mockup-body">
                        {/* Mock Nodes */}
                        <div className="mockup-node node-left">
                            <div className="node-badge paper">PAPER</div>
                            <h4>Attention Is All You Need</h4>
                            <p>Introduces the Transformer architecture, replacing recurrence with self-attention for parallelizable sequence modeling.</p>
                            <div className="node-footer">
                                <span className="bars"><i /><i /><i /></span> Updated now
                            </div>
                        </div>

                        <div className="mockup-node node-center">
                            <div className="node-badge insight">✦ INSIGHT</div>
                            <h4>Key Insight: Scalability</h4>
                            <p>Parallel processing of sequences drastically reduces training time vs. RNNs and LSTMs.</p>
                            <div className="node-footer">
                                <span className="bars"><i /><i /><i /></span> Updated now
                            </div>
                        </div>

                        <div className="mockup-node node-right">
                            <div className="node-badge citation">CITATION</div>
                            <h4>GPT-4 Technical Report</h4>
                            <p>Multi-modal LLM achieving human-level performance across professional and academic benchmarks.</p>
                            <div className="node-footer">
                                <span className="bars"><i /><i /><i /></span> Updated now
                            </div>
                        </div>

                        {/* Connecting lines conceptually represented */}
                        <svg className="mockup-lines" viewBox="0 0 800 200">
                            <path d="M 280 100 Q 400 0 420 80" fill="none" stroke="rgba(0,148,54,0.4)" strokeWidth="2" strokeDasharray="4 4" />
                            <path d="M 680 100 Q 600 200 580 120" fill="none" stroke="rgba(0,148,54,0.4)" strokeWidth="2" strokeDasharray="4 4" />
                        </svg>

                        <div className="mockup-status">
                            <span className="dot-green"></span> AI synthesizing...
                        </div>
                    </div>
                </div>
            </main>

            <section className="landing-stats">
                <div className="stat-card">
                    <h3>2,400+</h3>
                    <p>Active Researchers</p>
                    <span>across 40 countries</span>
                </div>
                <div className="stat-card">
                    <h3>10x</h3>
                    <p>Faster Literature Review</p>
                    <span>vs. manual research</span>
                </div>
                <div className="stat-card">
                    <h3>98%</h3>
                    <p>Citation Accuracy</p>
                    <span>AI-verified sources</span>
                </div>
                <div className="stat-card">
                    <h3>∞</h3>
                    <p>Canvas Size</p>
                    <span>no spatial limits</span>
                </div>
            </section>

            <section className="landing-why">
                <div className="landing-badge">
                    ✦ WHY CLARITY
                </div>
                <h2 className="section-title">Research, reimagined.</h2>
                <p className="section-subtitle">
                    Everything you need to go from a blank page to a structured, connected body of knowledge.
                </p>

                <div className="bento-container">
                    <div className="bento-col-left">
                        <div className="bento-card bento-large">
                            <div className="bento-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                                </svg>
                            </div>
                            <h3>AI-Powered Synthesis</h3>
                            <p>Automatically reads, summarizes, and cross-references dozens of papers. Get research-grade summaries in seconds, not hours.</p>

                            <div className="bento-mock-ui">
                                <div className="mock-ui-header">
                                    <span>Synthesis Progress</span>
                                    <span className="running-badge"><span className="dot-green"></span> Running</span>
                                </div>
                                <div className="progress-row">
                                    <div className="progress-labels"><span>Literature scan</span><span>81%</span></div>
                                    <div className="progress-bar"><div className="progress-fill" style={{ width: '81%' }}></div></div>
                                </div>
                                <div className="progress-row">
                                    <div className="progress-labels"><span>Cross-reference mapping</span><span>94%</span></div>
                                    <div className="progress-bar"><div className="progress-fill" style={{ width: '94%' }}></div></div>
                                </div>
                                <div className="progress-row">
                                    <div className="progress-labels"><span>Citation extraction</span><span>42%</span></div>
                                    <div className="progress-bar"><div className="progress-fill" style={{ width: '42%' }}></div></div>
                                </div>
                            </div>
                            <div className="bento-check">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                Save 10+ hours per literature review
                            </div>
                        </div>

                        <div className="bento-row-bottom">
                            <div className="bento-card">
                                <div className="bento-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                    </svg>
                                </div>
                                <h3>Smart Citations</h3>
                                <p>Every synthesis is fully traceable. Clarity automatically extracts, formats, and links citations back to their source material.</p>
                                <div className="mock-tags">
                                    <span>APA 7th</span><span>MLA 9</span><span>Chicago</span><span>BibTeX</span>
                                </div>
                                <div className="bento-check">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                    One-click export
                                </div>
                            </div>

                            <div className="bento-card">
                                <div className="bento-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                                    </svg>
                                </div>
                                <h3>Knowledge Graph</h3>
                                <p>Clarity maps semantic relationships between your sources automatically, surfacing hidden connections you might have missed.</p>
                                <div className="mock-graph">
                                    <svg viewBox="0 0 200 40">
                                        <circle cx="20" cy="20" r="4" fill="#009436" opacity="0.5" />
                                        <circle cx="60" cy="10" r="5" fill="#009436" />
                                        <circle cx="100" cy="30" r="4" fill="#009436" opacity="0.7" />
                                        <circle cx="140" cy="15" r="6" fill="#009436" />
                                        <circle cx="180" cy="25" r="4" fill="#009436" opacity="0.4" />
                                        <line x1="20" y1="20" x2="60" y2="10" stroke="#009436" strokeWidth="1" opacity="0.3" />
                                        <line x1="60" y1="10" x2="100" y2="30" stroke="#009436" strokeWidth="1" opacity="0.3" />
                                        <line x1="100" y1="30" x2="140" y2="15" stroke="#009436" strokeWidth="1" opacity="0.3" />
                                        <line x1="140" y1="15" x2="180" y2="25" stroke="#009436" strokeWidth="1" opacity="0.3" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bento-col-right">
                        <div className="bento-card bento-tall">
                            <div className="bento-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect>
                                </svg>
                            </div>
                            <h3>Infinite Canvas</h3>
                            <p>An unbounded, zoomable spatial workspace. Drag, arrange, and connect your research nodes exactly the way your mind works.</p>

                            <div className="bento-mock-canvas">
                                <div className="mock-node mn-1">Node 1</div>
                                <div className="mock-node mn-2">Node 2</div>
                                <div className="mock-node mn-3">Node 3</div>
                                <svg className="mock-canvas-lines" viewBox="0 0 200 100">
                                    <line x1="50" y1="30" x2="80" y2="50" stroke="#00AA45" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
                                    <line x1="80" y1="50" x2="120" y2="70" stroke="#00AA45" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
                                </svg>
                            </div>
                            <div className="bento-check">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                Organize without limits
                            </div>
                        </div>

                        <div className="bento-card bento-cta">
                            <div className="bento-icon-white">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                                </svg>
                            </div>
                            <h3>Ready to start?</h3>
                            <p>Join thousands of researchers already using Clarity.</p>
                            <button className="btn-white landing-btn-md" onClick={onEnter} style={{ marginTop: 'auto' }}>
                                Get Started Free <span style={{ marginLeft: '6px' }}>→</span>
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            <footer className="landing-footer">
                <div className="footer-content">
                    <div className="footer-logo">
                        <div className="landing-logo-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        </div>
                        <div>
                            <strong>Clarity</strong>
                            <p>AI research workspace for the<br />modern academic.</p>
                        </div>
                    </div>
                    <div className="footer-links">
                        <a href="#product">Product</a>
                        <a href="#pricing">Pricing</a>
                        <a href="#blog">Blog</a>
                        <a href="#docs">Docs</a>
                        <a href="#privacy">Privacy</a>
                        <a href="#terms">Terms</a>
                    </div>
                    <div className="footer-social">
                        <div className="social-icons">
                            <span className="icon-box">X</span>
                            <span className="icon-box">in</span>
                        </div>
                        <p>&copy; {new Date().getFullYear()} Clarity. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
