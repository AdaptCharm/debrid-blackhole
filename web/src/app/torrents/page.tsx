'use client';

import { useEffect, useState } from 'react';

import { useToast } from '@/hooks/use-toast';
import { formatBytes, formatSpeed } from '@/lib/utils';

interface Torrent {
    hash: string;
    name: string;
    size: number;
    progress: number;
    dlspeed: number;
    category: string;
    debrid: string;
    state: string;
}

interface CategoryOption {
    name: string;
    savePath: string;
}

const TorrentsPage: React.FC = () => {
    const { toast } = useToast();
    const [torrents, setTorrents] = useState<Torrent[]>([]);
    const [categories, setCategories] = useState<CategoryOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTorrents, setSelectedTorrents] = useState(new Set<string>());
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [selectedState, setSelectedState] = useState<string>('');
    const [allSelected, setAllSelected] = useState<boolean>(false);

    const stateColor = (state: string): string => {
        const stateColors: { [key: string]: string } = {
            downloading: 'bg-primary',
            pausedup: 'bg-success',
            error: 'bg-danger'
        };
        return stateColors[state?.toLowerCase()] || 'bg-secondary';
    };

    const handleCategoryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedCategory(event.target.value);
    };

    const handleStateChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedState(event.target.value);
    };

    const toggleSelectTorrent = (hash: string) => {
        const newSelection = new Set(selectedTorrents);
        if (newSelection.has(hash)) {
            newSelection.delete(hash);
        } else {
            newSelection.add(hash);
        }
        setSelectedTorrents(newSelection);
    };

    const handleSelectAll = () => {
        setAllSelected(!allSelected);
        const newSelection = new Set<string>();
        if (!allSelected) {
            filteredTorrents.forEach((torrent) => newSelection.add(torrent.hash));
        }
        setSelectedTorrents(newSelection);
    };

    const deleteSelectedTorrents = async () => {
        if (selectedTorrents.size === 0) return;
        if (!window.confirm(`Are you sure you want to delete ${selectedTorrents.size} selected torrents?`)) return;

        setLoading(true);
        try {
            const deletePromises = Array.from(selectedTorrents).map((hash) =>
                fetch(`/internal/torrents/${hash}`, { method: 'DELETE' })
            );
            await Promise.all(deletePromises);
            await fetchTorrents();
            setSelectedTorrents(new Set<string>());
            setAllSelected(false);
            toast({ title: 'Success', description: 'Selected torrents deleted successfully.', variant: 'default' });
        } catch (error) {
            console.error('Error deleting torrents:', error);
            toast({ title: 'Error', description: 'Failed to delete some torrents.', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const deleteTorrent = async (hash: string) => {
        if (!window.confirm('Are you sure you want to delete this torrent?')) return;

        setLoading(true);
        try {
            await fetch(`/internal/torrents/${hash}`, { method: 'DELETE' });
            await fetchTorrents();
            toast({ title: 'Success', description: 'Torrent deleted successfully.', variant: 'default' });
        } catch (error) {
            console.error('Error deleting torrent:', error);
            toast({ title: 'Error', description: 'Failed to delete torrent.', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const fetchTorrents = async () => {
        setLoading(true);
        try {
            const response = await fetch('/internal/torrents');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data: Torrent[] = await response.json();
            setTorrents(data);

            const categoriesRes = await fetch('/api/v2/torrents/categories');
            if (!categoriesRes.ok) {
                throw new Error(`HTTP error! status: ${categoriesRes.status}`);
            }
            const catData: Record<string, CategoryOption> = await categoriesRes.json();
            const categoriesList = Object.values(catData);
            setCategories(categoriesList);
        } catch (error: any) {
            console.error('Failed to fetch data:', error);
            toast({
                title: 'Error Fetching Torrents',
                description: error?.message || 'Failed to fetch data.',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTorrents();
        const intervalId = setInterval(fetchTorrents, 5000);
        return () => clearInterval(intervalId); // Cleanup on unmount
    }, []);

    const filteredTorrents = torrents.filter((t) => {
        if (selectedCategory && t.category !== selectedCategory) return false;
        if (selectedState && t.state?.toLowerCase() !== selectedState.toLowerCase()) return false;
        return true;
    });

    useEffect(() => {
        setAllSelected(
            filteredTorrents.length > 0 && filteredTorrents.every((torrent) => selectedTorrents.has(torrent.hash))
        );
    }, [filteredTorrents, selectedTorrents]);

    return (
        <div className='container mt-4'>
            <div className='card'>
                <div className='card-header d-flex justify-content-between align-items-center gap-4'>
                    <h4 className='mb-0 text-nowrap'>
                        <i className='bi bi-table me-2'></i>Active Torrents
                    </h4>
                    <div
                        className='d-flex align-items-center overflow-auto'
                        style={{ flexWrap: 'nowrap', gap: '0.5rem' }}>
                        <button
                            className='btn btn-outline-danger btn-sm'
                            style={{ display: selectedTorrents.size > 0 ? '' : 'none', flexShrink: 0 }}
                            onClick={deleteSelectedTorrents}>
                            <i className='bi bi-trash me-1'></i>Delete Selected
                        </button>
                        <button
                            className='btn btn-outline-secondary btn-sm me-2'
                            style={{ flexShrink: 0 }}
                            onClick={fetchTorrents}>
                            <i className='bi bi-arrow-clockwise me-1'></i>Refresh
                        </button>
                        <select
                            className='form-select form-select-sm d-inline-block me-2 w-auto'
                            id='stateFilter'
                            style={{ flexShrink: 0 }}
                            onChange={handleStateChange}
                            value={selectedState}>
                            <option value=''>All States</option>
                            <option value='downloading'>Downloading</option>
                            <option value='pausedup'>Paused</option>
                            <option value='error'>Error</option>
                        </select>
                        <select
                            className='form-select form-select-sm d-inline-block w-auto'
                            id='categoryFilter'
                            style={{ flexShrink: 0 }}
                            value={selectedCategory}
                            onChange={handleCategoryChange}>
                            <option value=''>All Categories</option>
                            {categories.map((cat) => (
                                <option key={cat.name} value={cat.name}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className='card-body p-0'>
                    <div className='table-responsive'>
                        {loading ? (
                            <div
                                style={{
                                    minHeight: '400px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                Loading...
                            </div>
                        ) : (
                            <table className='table-hover mb-0 table'>
                                <thead>
                                    <tr>
                                        <th>
                                            <input
                                                type='checkbox'
                                                className='form-check-input'
                                                checked={allSelected}
                                                onChange={handleSelectAll}
                                            />
                                        </th>
                                        <th>Name</th>
                                        <th>Size</th>
                                        <th>Progress</th>
                                        <th>Speed</th>
                                        <th>Category</th>
                                        <th>Debrid</th>
                                        <th>State</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody id='torrentsList'>
                                    {filteredTorrents.map((torrent) => (
                                        <tr key={torrent.hash} data-hash={torrent.hash}>
                                            <td>
                                                <input
                                                    type='checkbox'
                                                    className='form-check-input torrent-select'
                                                    data-hash={torrent.hash}
                                                    checked={selectedTorrents.has(torrent.hash)}
                                                    onChange={() => toggleSelectTorrent(torrent.hash)}
                                                />
                                            </td>
                                            <td
                                                className='text-truncate overflow-hidden text-nowrap'
                                                style={{ maxWidth: '350px' }}
                                                title={torrent.name}>
                                                {torrent.name}
                                            </td>
                                            <td className='text-nowrap'>{formatBytes(torrent.size)}</td>
                                            <td style={{ minWidth: '150px' }}>
                                                <div className='progress' style={{ height: '8px' }}>
                                                    <div
                                                        className='progress-bar'
                                                        role='progressbar'
                                                        style={{ width: `${(torrent.progress * 100).toFixed(1)}%` }}
                                                        aria-valuenow={parseFloat((torrent.progress * 100).toFixed(1))}
                                                        aria-valuemin={0}
                                                        aria-valuemax={100}
                                                    />
                                                </div>
                                                <small className='text-muted'>
                                                    {(torrent.progress * 100).toFixed(1)}%
                                                </small>
                                            </td>
                                            <td>{formatSpeed(torrent.dlspeed)}</td>
                                            <td>
                                                <span className='badge bg-secondary'>{torrent.category || 'None'}</span>
                                            </td>
                                            <td>{torrent.debrid || 'None'}</td>
                                            <td>
                                                <span className={`badge ${stateColor(torrent.state)}`}>
                                                    {torrent.state}
                                                </span>
                                            </td>
                                            <td>
                                                <button
                                                    className='btn btn-sm btn-outline-danger'
                                                    onClick={() => deleteTorrent(torrent.hash)}>
                                                    <i className='bi bi-trash'></i>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TorrentsPage;
