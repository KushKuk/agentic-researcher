import React from 'react';
import '../../styles/landing.css';

const LandingPage = ({ onEnter }) => {
    return (
        <div className="landing-page">
            {/* ── Sticky Floating Dock Nav ── */}
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

            {/* ── Hero ── */}
            <div className="landing-clip-wrapper">
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
                </main>

                {/* ── Dual-Mode Product Demo ── */}
                <section className="product-demo-section" id="product">
                    <div className="product-demo-label">
                        <span className="dot"></span> SEE HOW IT WORKS
                    </div>
                    <h2 className="section-title" style={{ marginBottom: '16px' }}>Two powerful modes,<br /> one seamless workflow.</h2>
                    <p className="section-subtitle" style={{ marginBottom: '60px' }}>
                        Clarity lets you move fluidly between a structured Summary Report and a free-form Infinite Canvas.
                    </p>

                    <div className="dual-mode-showcase">
                        {/* Summary Report Mock */}
                        <div className="mode-panel">
                            <div className="mode-panel-label summary-label">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '14px', height: '14px' }}>
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                </svg>
                                Summary Report
                            </div>
                            <div className="mode-mockup summary-mockup">
                                <div className="summary-header-bar">
                                    <div className="summary-title-block">
                                        <span className="summary-eyebrow">Research Report</span>
                                        <span className="summary-title-text">Transformer Architecture: Impact on NLP</span>
                                    </div>
                                    <div className="summary-chips">
                                        <span className="chip chip-green">AI-Generated</span>
                                        <span className="chip">Export</span>
                                    </div>
                                </div>
                                <div className="summary-body">
                                    <div className="summary-section-block">
                                        <div className="summary-section-title">Key Findings</div>
                                        <div className="summary-text-lines">
                                            <div className="text-line full"></div>
                                            <div className="text-line full"></div>
                                            <div className="text-line w80"></div>
                                        </div>
                                    </div>
                                    <div className="summary-section-block">
                                        <div className="summary-section-title">Sources</div>
                                        <div className="source-card">
                                            <div className="source-icon">📄</div>
                                            <div>
                                                <div className="source-title">Attention is All You Need</div>
                                                <div className="source-meta">Vaswani et al. · 2017</div>
                                            </div>
                                            <span className="chip chip-green" style={{ marginLeft: 'auto', fontSize: '10px' }}>✓</span>
                                        </div>
                                        <div className="source-card">
                                            <div className="source-icon">📄</div>
                                            <div>
                                                <div className="source-title">GPT-4 Technical Report</div>
                                                <div className="source-meta">OpenAI · 2023</div>
                                            </div>
                                            <span className="chip chip-green" style={{ marginLeft: 'auto', fontSize: '10px' }}>✓</span>
                                        </div>
                                    </div>
                                    <div className="summary-status-bar">
                                        <span className="dot-green"></span> 3 papers synthesized · AI verified
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Arrow Connector */}
                        <div className="mode-connector">
                            <div className="connector-line"></div>
                            <div className="connector-arrow-badge">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '18px', height: '18px' }}>
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                    <polyline points="12 5 19 12 12 19"></polyline>
                                </svg>
                                <span>Open in Canvas</span>
                            </div>
                            <div className="connector-line"></div>
                        </div>

                        {/* Canvas Mode Mock */}
                        <div className="mode-panel">
                            <div className="mode-panel-label canvas-label">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '14px', height: '14px' }}>
                                    <rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect>
                                </svg>
                                Infinite Canvas
                            </div>
                            <div className="mode-mockup canvas-mockup">
                                {/* Simulated canvas background grid */}
                                <div className="canvas-grid-bg"></div>

                                {/* Canvas nodes */}
                                <div className="canvas-node cn-1">
                                    <div className="cn-badge paper">PAPER</div>
                                    <div className="cn-title">Attention Is All You Need</div>
                                    <div className="cn-footer"><span className="bars"><i /><i /><i /></span> Vaswani et al.</div>
                                </div>
                                <div className="canvas-node cn-2">
                                    <div className="cn-badge insight">✦ INSIGHT</div>
                                    <div className="cn-title">Self-attention enables parallelization</div>
                                    <div className="cn-footer"><span className="bars"><i /><i /><i /></span> Key finding</div>
                                </div>
                                <div className="canvas-node cn-3">
                                    <div className="cn-badge citation">CITATION</div>
                                    <div className="cn-title">GPT-4 Technical Report</div>
                                    <div className="cn-footer"><span className="bars"><i /><i /><i /></span> OpenAI 2023</div>
                                </div>

                                {/* SVG connections */}
                                <svg className="canvas-edges" viewBox="0 0 380 260">
                                    <defs>
                                        <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                                            <path d="M0,0 L0,6 L8,3 z" fill="rgba(0,170,69,0.5)" />
                                        </marker>
                                    </defs>
                                    <path d="M 145 65 C 200 20 210 130 220 130" fill="none" stroke="rgba(0,170,69,0.4)" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#arrow)" />
                                    <path d="M 145 80 C 100 120 80 180 80 185" fill="none" stroke="rgba(0,170,69,0.3)" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#arrow)" />
                                </svg>

                                <div className="canvas-status-badge">
                                    <span className="dot-green"></span> AI synthesizing...
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── Stats ── */}
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

                {/* ── Why / Bento ── */}
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

                {/* ── Footer Dock ── */}
                <div className="landing-footer-wrapper">
                    <footer className="landing-footer-dock">
                        {/* Top row: branding + columns */}
                        <div className="footer-top-row">
                            {/* Left: logo, tagline, socials */}
                            <div className="footer-brand">
                                <div className="footer-brand-logo">
                                    <div className="landing-logo-icon" style={{ width: '24px', height: '24px' }}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                    </div>
                                    <strong>Clarity</strong>
                                </div>
                                <p className="footer-tagline">Your AI-powered research workspace.<br />Built for curious minds.</p>
                                <div className="footer-socials">
                                    <span className="footer-social-btn">in</span>
                                    <span className="footer-social-btn">𝕏</span>
                                </div>
                            </div>

                            {/* Right: two link columns */}
                            <div className="footer-link-cols">
                                <div className="footer-link-col">
                                    <span className="footer-col-heading">Pages</span>
                                    <a href="#product">Home</a>
                                    <a href="#product">Features</a>
                                    <a href="#pricing">Pricing</a>
                                    <a href="#blog">Blog</a>
                                </div>
                                <div className="footer-link-col">
                                    <span className="footer-col-heading">Information</span>
                                    <a href="#contact">Contact</a>
                                    <a href="#privacy">Privacy</a>
                                    <a href="#terms">Terms of use</a>
                                    <a href="#docs">Docs</a>
                                </div>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="footer-divider"></div>

                        {/* Bottom: copyright */}
                        <div className="footer-bottom-row">
                            <span className="footer-copy">© {new Date().getFullYear()} Clarity Inc.</span>
                        </div>
                    </footer>
                </div>
            </div> {/* end landing-clip-wrapper */}
        </div>
    );
};

export default LandingPage;
