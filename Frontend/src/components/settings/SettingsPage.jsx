import React, { useState } from 'react';
import '../../styles/global.css';

const SettingsPage = () => {
    // Mock state for demonstration
    const [name, setName] = useState('Abhishek Kushwaha');
    const [email, setEmail] = useState('abhishek@example.com');
    const [institution, setInstitution] = useState('University of Technology');
    const [role, setRole] = useState('Student');
    const [domain, setDomain] = useState('Computer Science');

    // Research prefs
    const [paperCount, setPaperCount] = useState(5);
    const [timeRange, setTimeRange] = useState('5y');
    const [databases, setDatabases] = useState({
        arxiv: true,
        pubmed: false,
        ieee: true,
        google_scholar: true
    });

    const handleDbChange = (db) => {
        setDatabases(prev => ({ ...prev, [db]: !prev[db] }));
    };

    const Section = ({ title, children }) => (
        <section style={{
            background: 'rgba(255,255,255,0.8)',
            borderRadius: 'var(--r-md)',
            border: '1px solid rgba(255,255,255,0.6)',
            boxShadow: 'var(--shadow-sm)',
            padding: '24px',
            marginBottom: '20px'
        }}>
            <h3 style={{
                fontSize: '18px',
                fontWeight: '700',
                color: 'var(--accent)',
                margin: '0 0 20px 0',
                paddingBottom: '12px',
                borderBottom: '1px solid rgba(0,0,0,0.05)'
            }}>{title}</h3>
            {children}
        </section>
    );

    const FormGroup = ({ label, children }) => (
        <div style={{ marginBottom: '16px' }}>
            <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: 'var(--muted)',
                marginBottom: '6px'
            }}>{label}</label>
            {children}
        </div>
    );

    const Input = (props) => (
        <input {...props} style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: '10px',
            border: '1px solid var(--stroke)',
            background: 'rgba(255,255,255,0.6)',
            fontSize: '14px',
            color: 'var(--text)',
            outline: 'none',
            transition: 'border-color 0.2s',
            ...props.style
        }}
            onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--stroke)'}
        />
    );

    const Select = (props) => (
        <select {...props} style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: '10px',
            border: '1px solid var(--stroke)',
            background: 'rgba(255,255,255,0.6)',
            fontSize: '14px',
            color: 'var(--text)',
            outline: 'none',
            cursor: 'pointer'
        }}>
            {props.children}
        </select>
    );

    const Checkbox = ({ label, checked, onChange }) => (
        <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px 0',
            cursor: 'pointer',
            fontSize: '14px',
            color: 'var(--text)'
        }}>
            <input type="checkbox" checked={checked} onChange={onChange} style={{
                width: '16px',
                height: '16px',
                accentColor: 'var(--primary)',
                cursor: 'pointer'
            }} />
            {label}
        </label>
    );

    return (
        <div className="settings-container" style={{ padding: '0 4px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
            <div style={{ marginBottom: '24px' }}>
                <h2 style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    color: 'var(--accent)',
                    margin: '0 0 4px 0',
                    letterSpacing: '-0.02em'
                }}>Settings</h2>
                <p style={{
                    color: 'var(--muted)',
                    fontSize: '14px',
                    margin: 0
                }}>Manage your account and research preferences.</p>
            </div>

            <Section title="Account">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <FormGroup label="Full Name">
                        <Input type="text" value={name} onChange={(e) => setName(e.target.value)} />
                    </FormGroup>
                    <FormGroup label="Email Address">
                        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </FormGroup>
                    <FormGroup label="Institution / Organization">
                        <Input type="text" value={institution} onChange={(e) => setInstitution(e.target.value)} />
                    </FormGroup>
                    <FormGroup label="Domain">
                        <Input type="text" placeholder="e.g. Computer Science, Biology" value={domain} onChange={(e) => setDomain(e.target.value)} />
                    </FormGroup>
                    <FormGroup label="Role">
                        <Select value={role} onChange={(e) => setRole(e.target.value)}>
                            <option value="Student">Student</option>
                            <option value="Faculty">Faculty / Researcher</option>
                            <option value="Industry">Industry Professional</option>
                            <option value="Other">Other</option>
                        </Select>
                    </FormGroup>
                </div>
            </Section>

            <Section title="Research Preferences">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <FormGroup label="Papers per query (Default)">
                        <Select value={paperCount} onChange={(e) => setPaperCount(Number(e.target.value))}>
                            <option value={3}>3 papers</option>
                            <option value={5}>5 papers</option>
                            <option value={10}>10 papers</option>
                            <option value={20}>20 papers</option>
                        </Select>
                    </FormGroup>
                    <FormGroup label="Time Range Filter">
                        <Select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
                            <option value="1y">Past Year</option>
                            <option value="3y">Past 3 Years</option>
                            <option value="5y">Past 5 Years</option>
                            <option value="all">Any Time</option>
                        </Select>
                    </FormGroup>
                </div>

                <FormGroup label="Preferred Databases">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px' }}>
                        <Checkbox label="arXiv" checked={databases.arxiv} onChange={() => handleDbChange('arxiv')} />
                        <Checkbox label="PubMed" checked={databases.pubmed} onChange={() => handleDbChange('pubmed')} />
                        <Checkbox label="IEEE Xplore" checked={databases.ieee} onChange={() => handleDbChange('ieee')} />
                        <Checkbox label="Google Scholar" checked={databases.google_scholar} onChange={() => handleDbChange('google_scholar')} />
                    </div>
                </FormGroup>
            </Section>

            <Section title="Security">
                <button className="btn btn-secondary" style={{ width: '100%', marginBottom: '12px', justifyContent: 'center' }}>
                    Change Password
                </button>
                <button className="btn btn-secondary" style={{ width: '100%', marginBottom: '12px', justifyContent: 'center' }}>
                    Setup Two-Factor Authentication
                </button>
                <div style={{ borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '16px', marginTop: '16px' }}>
                    <button style={{
                        width: '100%',
                        background: 'transparent',
                        border: '1px solid #ef4444',
                        color: '#ef4444',
                        padding: '10px',
                        borderRadius: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                    }}
                        onMouseEnter={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.05)'}
                        onMouseLeave={(e) => e.target.style.background = 'transparent'}
                    >
                        Delete Account
                    </button>
                </div>
            </Section>

            <div style={{ height: '40px' }}></div>
        </div>
    );
};

export default SettingsPage;
