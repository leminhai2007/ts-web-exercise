import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { projects } from '../data/projects';
import '../styles/HomePage.css';

export const HomePage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

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

    return (
        <div className="home-page">
            <header className="home-header">
                <h1>🎮 My Tools & Games</h1>
                <p>A collection of interactive projects and games</p>
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
