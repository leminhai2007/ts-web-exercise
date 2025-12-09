import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { projects } from '../data/projects';
import '../styles/HomePage.css';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const HomePage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isInstallable, setIsInstallable] = useState(false);
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    // Get all unique categories
    const allCategories = useMemo(() => {
        const categories = new Set<string>();
        projects.forEach(project => {
            project.categories.forEach(cat => categories.add(cat));
        });
        return Array.from(categories).sort();
    }, []);

    // Filter projects based on search and category
    const filteredProjects = useMemo(() => {
        return projects.filter(project => {
            const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) || project.description.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = selectedCategory === 'all' || project.categories.includes(selectedCategory);
            return matchesSearch && matchesCategory;
        });
    }, [searchTerm, selectedCategory]);

    // Handle PWA installation
    useEffect(() => {
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            setIsInstallable(true);
        };

        const handleAppInstalled = () => {
            setDeferredPrompt(null);
            setIsInstallable(false);
        };

        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            setDeferredPrompt(null);
            setIsInstallable(false);
        }
    };

    return (
        <div className="home-page">
            <header className="home-header">
                <h1>
                    <img src="/icon.svg" alt="Game Console" className="header-icon" />
                    My Tools & Games
                </h1>
                <p>A collection of interactive projects and games</p>
                <div className="header-actions">
                    <div className={`online-status ${isOnline ? 'online' : 'offline'}`}>
                        <span className="status-indicator"></span>
                        {isOnline ? 'Online' : 'Offline'}
                    </div>
                    {isInstallable && (
                        <button onClick={handleInstallClick} className="install-button">
                            📱 Install App
                        </button>
                    )}
                </div>
            </header>

            <div className="search-section">
                <input
                    type="text"
                    placeholder="Search by name or description..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="search-input"
                />

                <div className="category-filters">
                    <button className={selectedCategory === 'all' ? 'active' : ''} onClick={() => setSelectedCategory('all')}>
                        All
                    </button>
                    {allCategories.map(category => (
                        <button key={category} className={selectedCategory === category ? 'active' : ''} onClick={() => setSelectedCategory(category)}>
                            {category}
                        </button>
                    ))}
                </div>
            </div>

            <div className="projects-grid">
                {filteredProjects.length === 0 ? (
                    <p className="no-results">No projects found matching your criteria.</p>
                ) : (
                    filteredProjects.map(project => (
                        <Link to={project.path} key={project.id} className="project-card">
                            <div className="project-card-content">
                                <h2>{project.name}</h2>
                                <p>{project.description}</p>
                                <div className="project-categories">
                                    {project.categories.map(cat => (
                                        <span key={cat} className="category-tag">
                                            {cat}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
};
