import React from 'react';
import '../../styles/global.css';

const HeroCard = ({ onCreateClick, onOpenClick }) => {
    return (
        <section className="hero-card" aria-label="Quick entry">
            <div className="hero-inner">
                <div className="hero-top">
                    <div className="hero-copy">
                        <div className="kicker">
                            <span className="dot" aria-hidden="true"></span>
                            Ready in under a minute
                        </div>
                        <h1 className="hero-title">Start a research!</h1>
                        <p className="hero-desc">
                            Enter your research topic and let our AI agent handle the heavy lifting.
                        </p>
                    </div>

                    <div className="spark" aria-hidden="true">
                        <svg viewBox="0 0 24 24">
                            <path d="M12 2l1.2 4.2L17 7.4l-3.8 1.2L12 13l-1.2-4.4L7 7.4l3.8-1.2L12 2Z"></path>
                            <path d="M19 12l.7 2.4L22 15l-2.3.6L19 18l-.7-2.4L16 15l2.3-.6L19 12Z"></path>
                        </svg>
                    </div>
                </div>

                <div className="cta-row" role="group" aria-label="Primary actions">
                    <button
                        className="btn btn-primary"
                        type="button"
                        onClick={onCreateClick}
                    >
                        <svg className="btn-icon" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M12 5v14"></path>
                            <path d="M5 12h14"></path>
                        </svg>
                        Start Research
                    </button>

                    <button
                        className="btn btn-secondary"
                        type="button"
                        onClick={onOpenClick}
                    >
                        <svg className="btn-icon" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M4 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z"></path>
                            <path d="M8 13h8"></path>
                        </svg>
                        Open existing research topics 
                    </button>
                </div>
            </div>
        </section>
    );
};

export default HeroCard;
