import React, { useState, useEffect, useCallback } from 'react';
import { Upload, Download, Trash2, Search } from 'lucide-react';

const FileManagement = ({ token, user }) => {
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [folder, setFolder] = useState('general');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchFiles = useCallback(async () => {
    setIsLoading(true);
    let url = '/api/files';
    if (searchTerm) {
        url += `?search=${encodeURIComponent(searchTerm)}`;
    }
    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch files.');
      const data = await res.json();
      
      // Group files by folder
      const grouped = data.reduce((acc, file) => {
          (acc[file.folder] = acc[file.folder] || []).push(file);
          return acc;
      }, {});
      setFiles(grouped);

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [token, searchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => {
        fetchFiles();
    }, 500); // Debounce search
    return () => clearTimeout(timer);
  }, [fetchFiles]);

  const handleFileSelect = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setError('');
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('folder', folder);

    try {
      const res = await fetch('/api/files/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Failed to upload file.');
      }
      setSelectedFile(null);
      fetchFiles();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (fileId, filename) => {
    try {
        const res = await fetch(`/api/files/download/${fileId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Download failed.');
        
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);

    } catch (err) {
        alert(`Error: ${err.message}`);
    }
  };

  const handleDelete = async (fileId) => {
      if (window.confirm('Are you sure you want to permanently delete this file?')) {
          try {
              const res = await fetch(`/api/admin/files/${fileId}`, {
                  method: 'DELETE',
                  headers: { Authorization: `Bearer ${token}` }
              });
              if (!res.ok) {
                  const errData = await res.json();
                  throw new Error(errData.detail || 'Failed to delete file.');
              }
              fetchFiles();
          } catch (err) {
              alert(`Error: ${err.message}`);
          }
      }
  };

  return (
    <div>
      <h3 className="text-3xl font-medium text-gray-700">File Management</h3>
      
      <div className="mt-6 p-6 bg-white rounded-md shadow-md">
        <h4 className="text-lg font-semibold text-gray-700 mb-4">Upload New File</h4>
        <div className="grid md:grid-cols-3 gap-4 items-center">
            <input type="file" onChange={handleFileSelect} className="col-span-3 md:col-span-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"/>
            <input type="text" placeholder="Folder name (e.g., 'reports')" value={folder} onChange={e => setFolder(e.target.value)} className="col-span-3 md:col-span-1 w-full px-3 py-2 border rounded-md"/>
            <button onClick={handleUpload} disabled={isUploading || !selectedFile} className="col-span-3 md:col-span-1 flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400">
                <Upload size={20} className="mr-2"/>
                {isUploading ? 'Uploading...' : 'Upload'}
            </button>
        </div>
        {error && <p className="text-red-500 mt-4">Error: {error}</p>}
      </div>

      <div className="mt-8 bg-white p-6 rounded-md shadow-md">
        <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-semibold text-gray-700">Company Files</h4>
            <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center">
                    <Search size={20} className="text-gray-400"/>
                </span>
                <input type="text" placeholder="Search files..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-md"/>
            </div>
        </div>
        {isLoading ? (
            <p>Loading files...</p>
        ) : Object.keys(files).length === 0 ? (
            <p>No files found.</p>
        ) : (
            <div className="space-y-6">
                {Object.entries(files).map(([folderName, folderFiles]) => (
                    <div key={folderName}>
                        <h5 className="text-md font-semibold text-gray-600 capitalize mb-2 pb-1 border-b">{folderName}</h5>
                        <table className="min-w-full">
                            <tbody className="bg-white">
                                {folderFiles.map(file => (
                                <tr key={file.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{file.filename}</td>
                                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">{file.uploaded_by_email}</td>
                                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">{new Date(file.upload_date).toLocaleDateString()}</td>
                                    <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-right space-x-4">
                                        <button onClick={() => handleDownload(file.id, file.filename)} className="text-indigo-600 hover:text-indigo-900 inline-flex items-center">
                                            <Download size={20} />
                                        </button>
                                        {user.role === 'admin' && (
                                            <button onClick={() => handleDelete(file.id)} className="text-red-600 hover:text-red-900 inline-flex items-center">
                                                <Trash2 size={20} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};

export default FileManagement;