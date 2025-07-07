import React from 'react';

export default function Home() {
  const [url, setUrl] = React.useState('https://www.beebyclarkmeyler.com/');
  const [loading, setLoading] = React.useState(false);
  const [recommendations, setRecommendations] = React.useState(null);
  const [error, setError] = React.useState(null);
  const [schemaResult, setSchemaResult] = React.useState(null);
  const [generateLoading, setGenerateLoading] = React.useState(false);
  const [selectedType, setSelectedType] = React.useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setRecommendations(null);
    setSchemaResult(null);
    try {
      console.log('Requesting recommendations for URL:', url);
      const res = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) throw new Error(`API returned ${res.status}`);
      const data = await res.json();
      console.log('Received recommendations:', data.recommendations);
      setRecommendations(data.recommendations);
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (type) => {
    console.log('Generate button clicked for type:', type);
    setGenerateLoading(true);
    setSelectedType(type);
    setSchemaResult(null);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, type }),
      });
      console.log('Generate API call status:', res.status);
      if (!res.ok) throw new Error(`API returned ${res.status}`);
      const data = await res.json();
      console.log('Received schema:', data.schema);
      setSchemaResult(data.schema);
    } catch (err) {
      console.error('Error generating schema:', err);
      setError(err.message || 'Error generating schema');
    } finally {
      setGenerateLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">BCM Schema Markup Creator</h1>

      <form onSubmit={handleSubmit} className="mb-6">
        <label htmlFor="url" className="block mb-2 font-medium">Enter URL:</label>
        <input
          id="url"
          type="url"
          className="w-full p-2 border rounded mb-2"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded"
          disabled={loading}
        >
          {loading ? 'Loading…' : 'Get Recommendations'}
        </button>
      </form>

      {loading && <p className="text-blue-600 font-medium mb-4">Working on it…</p>}
      {error && <p className="text-red-600 mb-4">Error: {error}</p>}

      {recommendations && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Recommended Schema Types</h2>
          <ul className="space-y-4">
            {recommendations.map((rec, i) => (
              <li key={i} className="p-4 border rounded flex justify-between items-start">
                <div>
                  <strong>{rec.type}</strong>: {rec.reason}
                </div>
                <button
                  className="ml-4 px-3 py-1 bg-green-600 text-white rounded text-sm"
                  onClick={() => handleGenerate(rec.type)}
                  disabled={generateLoading && selectedType === rec.type}
                >
                  {generateLoading && selectedType === rec.type ? 'Generating…' : 'Generate Schema'}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {schemaResult && (
        <div className="p-4 border rounded bg-gray-50">
          <h2 className="text-lg font-semibold mb-2">Generated Schema ({selectedType})</h2>
          <pre className="whitespace-pre-wrap text-sm">
            {JSON.stringify(schemaResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
