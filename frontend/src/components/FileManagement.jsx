import React, { useState, useEffect, useCallback } from 'react';
import { Upload, Download } from 'lucide-react';

const FileManagement = ({ token }) => {
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const fetchFiles = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/files', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch files.');
      const data = await res.json();
      setFiles(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleFileSelect = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Please select a file first.');
      return;
    }
    setIsUploading(true);
    setError('');
    const formData = new FormData();
    formData.append('file', selectedFile);

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
      setSelectedFile(null); // Clear selection
      fetchFiles(); // Refresh file list
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

  if (isLoading) return <div>Loading files...</div>;

  return (
    <div>
      <h3 className="text-3xl font-medium text-gray-700">File Management</h3>
      
      <div className="mt-6 p-6 bg-white rounded-md shadow-md">
        <h4 className="text-lg font-semibold text-gray-700 mb-4">Upload New File</h4>
        <div className="flex items-center space-x-4">
            <input type="file" onChange={handleFileSelect} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"/>
            <button onClick={handleUpload} disabled={isUploading || !selectedFile} className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400">
                <Upload size={20} className="mr-2"/>
                {isUploading ? 'Uploading...' : 'Upload'}
            </button>
        </div>
        {error && <p className="text-red-500 mt-4">Error: {error}</p>}
      </div>

      <div className="mt-8 bg-white p-6 rounded-md shadow-md">
        <h4 className="text-lg font-semibold text-gray-700 mb-4">Company Files</h4>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Filename</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Uploaded By</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {files.map(file => (
              <tr key={file.id}>
                <td className="px-6 py-4 whitespace-nowrap">{file.filename}</td>
                <td className="px-6 py-4 whitespace-nowrap">{file.uploaded_by_email}</td>
                <td className="px-6 py-4 whitespace-nowrap">{new Date(file.upload_date).toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button onClick={() => handleDownload(file.id, file.filename)} className="text-indigo-600 hover:text-indigo-900">
                    <Download size={20} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FileManagement;
