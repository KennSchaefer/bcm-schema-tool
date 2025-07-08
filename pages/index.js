// File: pages/index.js (client-side component)
import React, { useState, useEffect } from 'react'
import axios from 'axios'

export default function Home() {
  const [mode, setMode] = useState('url')
  const [sitemapUrls, setSitemapUrls] = useState([])
  const [selectedUrl, setSelectedUrl] = useState('')
  const [customUrl, setCustomUrl] = useState('')
  const [filterTerm, setFilterTerm] = useState('')
  const [pastedContent, setPastedContent] = useState('')

  const [recommendations, setRecommendations] = useState([])
  const [selectedType, setSelectedType] = useState('')
  const [generatedJsonLd, setGeneratedJsonLd] = useState(null)

  const [loadingSitemap, setLoadingSitemap] = useState(false)
  const [loadingRecommend, setLoadingRecommend] = useState(false)
  const [loadingGenerate, setLoadingGenerate] = useState(false)

  // Fetch sitemap once when in URL mode
  useEffect(() => {
    if (mode === 'url' && sitemapUrls.length === 0) {
      setLoadingSitemap(true)
      axios.get('/api/sitemap')
        .then(res => setSitemapUrls(res.data.urls || []))
        .catch(() => alert('Unable to load sitemap.'))
        .finally(() => setLoadingSitemap(false))
    }
  }, [mode])

  const handleSubmit = async e => {
    e.preventDefault()
    const url = mode === 'url' ? (customUrl || selectedUrl) : null
    if (mode === 'url' && !url) return alert('Please select or enter a URL.')
    if (mode === 'content' && !pastedContent.trim()) return alert('Please paste content.')

    setLoadingRecommend(true)
    setRecommendations([])
    setSelectedType('')
    setGeneratedJsonLd(null)

    try {
      const payload = mode === 'url' ? { url } : { html: pastedContent }
      const res = await axios.post('/api/recommend', payload)
      setRecommendations(res.data.types || [])
    } catch (err) {
      console.error('Recommend error:', err)
      alert('Failed to fetch recommendations. See console.')
    } finally {
      setLoadingRecommend(false)
    }
  }

  const handleGenerate = async () => {
    if (!selectedType) return alert('Please select a schema type.')
    const url = mode === 'url' ? (customUrl || selectedUrl) : null

    setLoadingGenerate(true)
    setGeneratedJsonLd(null)

    try {
      const payload = mode === 'url'
        ? { url, type: selectedType }
        : { html: pastedContent, type: selectedType }
      const res = await axios.post('/api/generate', payload)
      // direct assignment, let JSON.stringify handle formatting
      setGeneratedJsonLd(res.data.jsonLd)
    } catch (err) {
      console.error('Generate error:', err)
      alert('Failed to generate JSON-LD. See console.')
    } finally {
      setLoadingGenerate(false)
    }
  }

  const handleClear = () => {
    setMode('url')
    setFilterTerm('')
    setSelectedUrl('')
    setCustomUrl('')
    setPastedContent('')
    setRecommendations([])
    setSelectedType('')
    setGeneratedJsonLd(null)
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '1rem', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Schema Markup Creator</h1>

      {/* Mode toggle */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ marginRight: '1rem' }}>
          <input type="radio" value="url" checked={mode==='url'} onChange={()=>setMode('url')} /> Use URL
        </label>
        <label>
          <input type="radio" value="content" checked={mode==='content'} onChange={()=>setMode('content')} /> Paste Content
        </label>
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} style={{ marginBottom: '1rem' }}>
        {mode==='url' ? (
          <>
            <div style={{ display:'flex', gap:'0.5rem', marginBottom:'0.5rem' }}>
              <input
                type="text"
                placeholder="Filter sitemap URLs..."
                value={filterTerm}
                onChange={e=>setFilterTerm(e.target.value)}
                style={{ flex:1, padding:'0.5rem', border:'1px solid #ccc', borderRadius:'4px' }}
              />
              <select
                value={selectedUrl}
                onChange={e=>setSelectedUrl(e.target.value)}
                style={{ flex:2, padding:'0.5rem', border:'1px solid #ccc', borderRadius:'4px' }}
              >
                <option value="">-- Select URL --</option>
                {sitemapUrls
                  .filter(u => u.toLowerCase().includes(filterTerm.toLowerCase()))
                  .map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <input
              type="url"
              placeholder="Or enter a different URL"
              value={customUrl}
              onChange={e=>setCustomUrl(e.target.value)}
              style={{ width:'100%', padding:'0.5rem', border:'1px solid #ccc', borderRadius:'4px', marginBottom:'0.5rem' }}
            />
          </>
        ) : (
          <textarea
            placeholder="Paste your HTML content..."
            value={pastedContent}
            onChange={e=>setPastedContent(e.target.value)}
            style={{ width:'100%', height:'200px', padding:'0.5rem', border:'1px solid #ccc', borderRadius:'4px', marginBottom:'0.5rem' }}
          />
        )}
        <button type="submit" disabled={loadingRecommend} style={{ padding:'0.5rem 1rem', backgroundColor:'#1D4ED8', color:'#fff', border:'none', borderRadius:'4px', cursor:'pointer' }}>
          {loadingRecommend?'Loading…':'Get Recommendations'}
        </button>
        <button type="button" onClick={handleClear} style={{ marginLeft:'1rem', padding:'0.5rem 1rem', backgroundColor:'#EF4444', color:'#fff', border:'none', borderRadius:'4px', cursor:'pointer' }}>
          Clear
        </button>
      </form>

      {/* Recommendations */}
      {recommendations.length>0 && (
        <div style={{ marginBottom:'1rem' }}>
          <h2 style={{ fontSize:'1.25rem', marginBottom:'0.5rem' }}>Select a schema type:</h2>
          <div style={{ display:'flex', flexWrap:'wrap' }}>
            {recommendations.map(rec => (
              <button
                key={rec.type}
                type="button"
                onClick={()=>setSelectedType(selectedType===rec.type?'':rec.type)}
                style={{ backgroundColor:selectedType===rec.type?'#1D4ED8':'#fff', color:selectedType===rec.type?'#fff':'#000', border:'1px solid #ccc', borderRadius:'4px', padding:'0.5rem 1rem', margin:'0.25rem', cursor:'pointer' }}
              >{rec.type}</button>
            ))}
          </div>
          <button type="button" onClick={handleGenerate} disabled={loadingGenerate} style={{ padding:'0.5rem 1rem', backgroundColor:'#16A34A', color:'#fff', border:'none', borderRadius:'4px', cursor:'pointer', marginTop:'0.5rem' }}>
            {loadingGenerate?'Generating…':'Generate JSON-LD'}
          </button>
        </div>
      )}

      {/* JSON-LD Output */}
      {generatedJsonLd && (
        <div>
          <h2 style={{ fontSize:'1.25rem', marginBottom:'0.5rem' }}>Generated JSON-LD:</h2>
          <pre style={{ backgroundColor:'#F3F4F6', padding:'1rem', borderRadius:'4px', whiteSpace:'pre', overflowX:'auto', fontFamily:'monospace' }}>
            {'<script type="application/ld+json">'}
            {'\n'}
            {JSON.stringify(generatedJsonLd, null, 2)}
            {'\n'}
            {'</script>'}
          </pre>
          <button type="button" onClick={()=>{
            const script = `<script type=\"application/ld+json\">\n${JSON.stringify(generatedJsonLd, null, 2)}\n</script>`
            navigator.clipboard.writeText(script).then(()=>alert('Copied!')).catch(()=>alert('Copy failed'))
          }} style={{ marginTop:'0.5rem', padding:'0.5rem 1rem', backgroundColor:'#3B82F6', color:'#fff', border:'none', borderRadius:'4px', cursor:'pointer' }}>
            Copy to Clipboard
          </button>
        </div>
      )}
    </div>
  )
}
