import React, { useState, useEffect, useRef } from 'react';
import AppLayout from './components/layout/AppLayout';
import AppBar from './components/navigation/AppBar';
import BottomNav from './components/navigation/BottomNav';
import HeroCard from './components/home/HeroCard';

import Modal from './components/ui/Modal';
import Toast from './components/ui/Toast';
import './styles/global.css';

import WorkspacesPage from './components/workspaces/WorkspacesPage';

function App() {
    const [activeTab, setActiveTab] = useState('home');
    const [modalOpen, setModalOpen] = useState(false);
    const [toast, setToast] = useState({ show: false, title: '', desc: '' });
    const [workspaceName, setWorkspaceName] = useState('');

    // State for workspaces list
    const [workspaces, setWorkspaces] = useState([]);

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
        setModalOpen(true);
        setWorkspaceName('');
    };

    const handleConfirmCreate = () => {
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

        // Add new workspace
        const newWorkspace = {
            id: Date.now().toString(),
            name: workspaceName.trim(),
            createdAt: new Date().toISOString()
        };
        setWorkspaces(prev => [newWorkspace, ...prev]);

        setModalOpen(false);
        showToast(
            'Workspace ready',
            `Created research topic: “${workspaceName.trim()}”.`
        );
        // Switch to workspaces tab to see the new item
        setActiveTab('workspaces');
    };

    const handleOpenWorkspace = (id) => {
        console.log('Open workspace:', id);
        // Future: Navigate to workspace detail / flow editor
    };

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
                    activeTab === 'home'
                        ? { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }
                        : {}
                }>
                    {activeTab === 'home' && (
                        <div style={{ width: '100%', maxWidth: '800px' }}>
                            <HeroCard
                                onCreateClick={handleCreateClick}
                                onOpenClick={() => setActiveTab('workspaces')}
                            />
                        </div>
                    )}

                    {activeTab === 'workspaces' && (
                        <WorkspacesPage
                            workspaces={workspaces}
                            onCreateClick={handleCreateClick}
                            onOpenWorkspace={handleOpenWorkspace}
                        />
                    )}
                </main>
            </AppLayout>

            <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

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
