import { useState, useEffect } from 'react';
import axios from 'axios';
import { ModuleProps } from '../ModuleProps';
import { Tag } from '../shared/Primitives';

const API_BASE = 'http://localhost:3000/api';

export default function VaultBrowser({ toast }: ModuleProps) {
    const [folders, setFolders] = useState<any[]>([]);
    const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
    const [files, setFiles] = useState<any[]>([]);
    const [fileContent, setFileContent] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<string | null>(null);

    useEffect(() => {
        fetchFolders();
    }, []);

    const fetchFolders = async () => {
        try {
            const res = await axios.get(`${API_BASE}/vault`);
            setFolders(res.data || []);
        } catch (err) {
            toast('Failed to fetch vault folders', 'error');
        }
    };

    const fetchFiles = async (folder: string) => {
        try {
            setSelectedFolder(folder);
            const res = await axios.get(`${API_BASE}/vault/${folder}`);
            setFiles(res.data || []);
            setFileContent(null);
            setSelectedFile(null);
        } catch (err) {
            toast('Failed to fetch files', 'error');
        }
    };

    const readFile = async (file: string) => {
        try {
            setSelectedFile(file);
            const res = await axios.get(`${API_BASE}/vault/${selectedFolder}/${file}`);
            setFileContent(typeof res.data === 'string' ? res.data : JSON.stringify(res.data, null, 2));
        } catch (err) {
            toast('Failed to read file', 'error');
        }
    };

    const deleteItem = async (folder: string, file?: string) => {
        if (!window.confirm(`Are you sure you want to delete this ${file ? 'file' : 'folder'}?`)) return;
        try {
            const url = file ? `${API_BASE}/vault/${folder}/${file}` : `${API_BASE}/vault/${folder}`;
            await axios.delete(url);
            toast('Deleted successfully', 'success');
            if (file) {
                fetchFiles(folder);
            } else {
                fetchFolders();
                setSelectedFolder(null);
                setFiles([]);
                setFileContent(null);
            }
        } catch (err) {
            toast('Delete failed', 'error');
        }
    };

    return (
        <div className="anim">
            <h2 className="nb-section">🗄️ Data Vault Browser</h2>

            <div className="grid grid-cols-4 gap-4" style={{ height: 'calc(100vh - 220px)' }}>
                {/* FOLDERS LIST */}
                <div className="nb-card col-span-1 overflow-y-auto flex flex-col">
                    <h3 className="text-xs font-bold text-mn mb-3 uppercase tracking-wider sticky top-0 bg-cd py-1">Directories</h3>
                    <div className="flex-1">
                        {folders.map(f => (
                            <div key={f.name}
                                className={`p-2 mb-1 rounded cursor-pointer text-xs flex justify-between items-center group ${selectedFolder === f.name ? 'bg-am text-white' : 'hover:bg-white/5'}`}
                                onClick={() => fetchFiles(f.name)}>
                                <div className="flex flex-col truncate pr-2">
                                    <span className="font-semibold">📁 {f.name}</span>
                                    <span className="text-[9px] opacity-60">{f.fileCount} files · {new Date(f.timestamp).toLocaleDateString()}</span>
                                </div>
                                <span className="opacity-0 group-hover:opacity-100 p-1 hover:bg-rd rounded transition-all"
                                    onClick={(e) => { e.stopPropagation(); deleteItem(f.name) }}>
                                    🗑
                                </span>
                            </div>
                        ))}
                        {folders.length === 0 && <div className="text-[10px] text-mn italic p-4 text-center">No data collected yet.</div>}
                    </div>
                </div>

                {/* FILES LIST */}
                <div className="nb-card col-span-1 overflow-y-auto flex flex-col">
                    <h3 className="text-xs font-bold text-mn mb-3 uppercase tracking-wider sticky top-0 bg-cd py-1">Files</h3>
                    <div className="flex-1">
                        {selectedFolder ? (
                            files.map(f => (
                                <div key={f.name}
                                    className={`p-2 mb-1 rounded cursor-pointer text-xs flex justify-between items-center group ${selectedFile === f.name ? 'bg-am/30 border border-am' : 'hover:bg-white/5'}`}
                                    onClick={() => readFile(f.name)}>
                                    <div className="flex flex-col truncate pr-2">
                                        <span className="font-semibold">📄 {f.name}</span>
                                        <span className="text-[9px] opacity-60">{(f.size / 1024).toFixed(1)} KB · {new Date(f.timestamp).toLocaleTimeString()}</span>
                                    </div>
                                    <span className="opacity-0 group-hover:opacity-100 p-1 hover:bg-rd rounded transition-all"
                                        onClick={(e) => { e.stopPropagation(); deleteItem(selectedFolder, f.name) }}>
                                        🗑
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="text-xs text-mn italic text-center mt-10">Select a folder to browse files</div>
                        )}
                        {selectedFolder && files.length === 0 && <div className="text-[10px] text-mn italic p-4 text-center">Directory is empty.</div>}
                    </div>
                </div>

                {/* CONTENT PREVIEW */}
                <div className="nb-card col-span-2 overflow-hidden flex flex-col">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-xs font-bold text-mn uppercase tracking-wider">Preview</h3>
                        {selectedFile && <Tag bg="var(--bl)">{selectedFile.split('.').pop()?.toUpperCase()}</Tag>}
                    </div>
                    <div className="flex-1 bg-sf/50 rounded-lg p-4 font-mono text-[10px] overflow-auto whitespace-pre-wrap custom-scrollbar border border-bd leading-relaxed">
                        {fileContent ? (
                            fileContent
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-mn text-center">
                                <div className="text-3xl mb-3">🔭</div>
                                <div>Select a file from the list to preview its contents</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
