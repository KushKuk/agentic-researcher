import React, { useState, useEffect, useRef } from 'react';
import AppLayout from './components/layout/AppLayout';
import AppBar from './components/navigation/AppBar';
import BottomNav from './components/navigation/BottomNav';
import HeroCard from './components/home/HeroCard';

import Modal from './components/ui/Modal';
import Toast from './components/ui/Toast';
import './styles/global.css';

import WorkspacesPage from './components/workspaces/WorkspacesPage';

import SettingsPage from './components/settings/SettingsPage';
import ResearchInput from './components/home/ResearchInput';
import ResearchSummary from './components/home/ResearchSummary';
import WorkspaceCanvas from './components/workspaces/WorkspaceCanvas';
import LandingPage from './components/home/LandingPage';
import AuthPage from './components/auth/AuthPage';

import { useAuth } from './api/AuthContext';

function App() {
    const { user, loading } = useAuth();
    // 'landing' | 'auth' | 'app' 
    // We start assuming we are in the landing state until we know the user is authenticated
    const [appState, setAppState] = useState('landing');

    // Auto-login if session is detected on load
    useEffect(() => {
        if (!loading && user) {
            setAppState('app');
            showToast('Welcome back', `Logged in as ${user.email}`);
        } else if (!loading && !user && appState === 'app') {
            // We lost session while trying to get into the app. Fallback explicitly
            setAppState('auth');
        }
    }, [user, loading]);

    const [activeTab, setActiveTab] = useState('home');
    const [modalOpen, setModalOpen] = useState(false);
    const [toast, setToast] = useState({ show: false, title: '', desc: '' });
    const [workspaceName, setWorkspaceName] = useState('');
    const [researchState, setResearchState] = useState('idle'); // 'idle' | 'input' | 'complete'

    const [activeWorkspaceId, setActiveWorkspaceId] = useState(null);

    const wsNameInputRef = useRef(null);

    useEffect(() => {
        // Subtle initial guidance
        const timers = [];
        timers.push(
            setTimeout(() => {
                setToast({
                    show: true,
                    title: 'Welcome to Clarity',
                    desc: 'Create a workspace now, or open your existing workspaces anytime.',
                });
            }, 650)
        );
        return () => timers.forEach((t) => clearTimeout(t));
    }, []);

    const showToast = (title, desc) => {
        setToast({ show: true, title, desc });
    };

    const handleToastClose = () => {
        setToast((prev) => ({ ...prev, show: false }));
    };

    const handleCreateClick = () => {
        if (activeTab === 'home') {
            setResearchState('input');
        } else {
            setModalOpen(true);
            setWorkspaceName('');
        }
    };

    const handleConfirmCreate = async () => {
        if (!workspaceName.trim()) {
            showToast('Name needed', 'Add a workspace name to continue.');
            if (wsNameInputRef.current) {
                wsNameInputRef.current.focus();
                wsNameInputRef.current.animate(
                    [
                        { transform: 'translateX(0)' },
                        { transform: 'translateX(-6px)' },
                        { transform: 'translateX(6px)' },
                        { transform: 'translateX(0)' },
                    ],
                    { duration: 260, easing: 'cubic-bezier(.2,.9,.2,1)' }
                );
            }
            return;
        }

        try {
            const res = await fetch('/api/workspaces', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: workspaceName.trim() }),
                credentials: 'include'
            });

            if (res.ok) {
                const json = await res.json();
                setModalOpen(false);
                showToast('Workspace ready', `Created research topic: “${json.data.name}”.`);
                setActiveWorkspaceId(json.data.id);
                setActiveTab('workspace-canvas');
                setWorkspaceName('');
            } else if (res.status === 409) {
                showToast('Error', 'Workspace name already exists.');
            } else {
                showToast('Error', 'Failed to create workspace.');
            }
        } catch (error) {
            console.error('Create workspace error:', error);
            showToast('Error', 'Failed to connect to server.');
        }
    };

    const handleOpenWorkspace = (id) => {
        console.log('Open workspace:', id);
        setActiveWorkspaceId(id);
        setActiveTab('workspace-canvas');
    };

    const handleResearchSubmit = async (query) => {
        setToast({ show: true, title: 'Extracting data', desc: 'Analyzing sources and generating report...' });

        try {
            const res = await fetch('/api/workspaces', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: query }),
                credentials: 'include'
            });

            if (res.ok) {
                const json = await res.json();
                setActiveWorkspaceId(json.data.id);
                setResearchState('complete');
                setToast({ show: false, title: '', desc: '' });
            } else {
                setToast({ show: true, title: 'Error', desc: 'Failed to create workspace from query.' });
                setTimeout(() => setToast({ show: false, title: '', desc: '' }), 3000);
            }
        } catch (error) {
            console.error('Research submit error:', error);
            setToast({ show: true, title: 'Error', desc: 'Failed to connect to server.' });
            setTimeout(() => setToast({ show: false, title: '', desc: '' }), 3000);
        }
    };

    const handleEnterWorkspaceFromSummary = () => {
        showToast('Workspace initialized', 'Entering interactive canvas mode...');
        setResearchState('idle'); // clear out summary mode
        setActiveTab('workspace-canvas');
    };

    // ── Routing ─────────────────────────────────
    if (loading) {
        return (
            <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', color: 'var(--muted)' }}>
                <span>Loading Clarity...</span>
            </div>
        );
    }

    if (appState === 'landing' && !user) {
        return (
            <LandingPage onEnter={() => setAppState('auth')} />
        );
    }

    if (appState === 'auth' && !user) {
        return (
            <AuthPage />
        );
    }

    return (
        <>
            <AppLayout>
                <AppBar
                    title="Clarity"
                    subtitle="Start fast. Stay organized."
                    onHelpClick={() =>
                        showToast(
                            'Quick tip',
                            'Bottom tabs take you to Workspaces and Settings. Create is the fastest start.'
                        )
                    }
                />

                <main className="content" aria-label="Landing content" style={
                    activeTab === 'home' && researchState !== 'complete'
                        ? { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }
                        : {}
                }>
                    {activeTab === 'home' && researchState === 'idle' && (
                        <div style={{ width: '100%', maxWidth: '800px' }}>
                            <HeroCard
                                onCreateClick={handleCreateClick}
                                onOpenClick={() => setActiveTab('workspaces')}
                            />
                        </div>
                    )}

                    {activeTab === 'home' && researchState === 'input' && (
                        <ResearchInput onSubmit={handleResearchSubmit} />
                    )}

                    {activeTab === 'home' && researchState === 'complete' && (
                        <ResearchSummary onEnterWorkspace={handleEnterWorkspaceFromSummary} />
                    )}

                    {activeTab === 'workspaces' && (
                        <WorkspacesPage
                            onCreateClick={handleCreateClick}
                            onOpenWorkspace={handleOpenWorkspace}
                        />
                    )}

                    {activeTab === 'settings' && (
                        <SettingsPage />
                    )}
                    {activeTab === 'workspace-canvas' && activeWorkspaceId && (
                        <div style={{ flex: 1, padding: '5px', height: '100%', width: '100%' }}>
                            <WorkspaceCanvas workspaceId={activeWorkspaceId} onBack={() => setActiveTab('workspaces')} />
                        </div>
                    )}
                </main>
            </AppLayout>

            <BottomNav
                activeTab={activeTab}
                onTabChange={(tab) => {
                    setActiveTab(tab);
                    if (tab !== 'home') setResearchState('idle');
                }}
                isMinimized={(researchState !== 'idle' && activeTab === 'home') || activeTab === 'workspace-canvas'}
            />

            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title="Create a research topic"
                initialFocusRef={wsNameInputRef}
            >
                <div className="field">
                    <div className="label">Topic name</div>
                    <input
                        ref={wsNameInputRef}
                        className="input"
                        type="text"
                        placeholder="e.g., Quantum Computing Trends"
                        value={workspaceName}
                        onChange={(e) => setWorkspaceName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleConfirmCreate()}
                    />
                </div>

                <div className="modal-actions">
                    <button
                        className="btn btn-ghost"
                        type="button"
                        onClick={() => setModalOpen(false)}
                    >
                        <svg className="btn-icon" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M15 18l-6-6 6-6"></path>
                        </svg>
                        Cancel
                    </button>

                    <button
                        className="btn btn-primary"
                        type="button"
                        onClick={handleConfirmCreate}
                    >
                        <svg className="btn-icon" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M20 7 10 17l-5-5"></path>
                        </svg>
                        Create
                    </button>
                </div>
            </Modal>

            <Toast
                show={toast.show}
                title={toast.title}
                desc={toast.desc}
                onClose={handleToastClose}
            />
        </>
    );
}

export default App;
