import React, { useState, useEffect, useCallback } from 'react';

const LogsViewer = ({ token }) => {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/logs', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch logs.');
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  if (isLoading) return <div>Loading logs...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div>
      <h3 className="text-3xl font-medium text-gray-700">Activity Logs</h3>
      <div className="mt-8 bg-white p-6 rounded-md shadow-md">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.map(log => (
                <tr key={log.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{log.actor_email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{log.action}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LogsViewer;
