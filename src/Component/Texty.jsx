import React, { useState } from 'react';
import axios from 'axios';

const Texty = () => {
  const [prompt, setPrompt] = useState('');
  const [currentImage, setCurrentImage] = useState('');
  const [gallery, setGallery] = useState([]); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [model, setModel] = useState('stable-diffusion-xl-1024-v1-0');
  const [activeTab, setActiveTab] = useState('generate'); 
  
  const MODELS = [
    { id: 'stable-diffusion-xl-1024-v1-0', name: 'SDXL 1.0' },
    { id: 'stable-diffusion-v1-6', name: 'SD 1.6' },
    { id: 'stable-diffusion-512-v2-1', name: 'SD 2.1 (512)' },
    { id: 'stable-diffusion-768-v2-1', name: 'SD 2.1 (768)' },
  ];

  const generateImage = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setLoading(true);
    setError('');
    setCurrentImage('');

    try {
      const API_URL = `https://api.stability.ai/v1/generation/${model}/text-to-image`;
      const API_KEY = process.env.REACT_APP_STABILITY_API_KEY || 'your_api_key';

      const response = await axios.post(
        API_URL,
        {
          text_prompts: [{ text: prompt }],
          cfg_scale: 7,
          height: model.includes('xl') ? 1024 : 512,
          width: model.includes('xl') ? 1024 : 512,
          steps: 30,
          samples: 1,
        },
        {
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
        }
      );

      if (response.data.artifacts?.[0]?.base64) {
        const newImage = `data:image/png;base64,${response.data.artifacts[0].base64}`;
        setCurrentImage(newImage);
        setGallery(prev => [
          {
            image: newImage,
            prompt: prompt,
            model: model,
            date: new Date().toLocaleString()
          },
          ...prev
        ]);
      } else {
        throw new Error('No image in response');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Generation failed');
      console.error('API Error:', err.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1>Text to Image Generator</h1>
      
      {/* Tab Navigation */}
      <div style={{ display: 'flex', marginBottom: '20px', borderBottom: '1px solid #ddd' }}>
        <button
          onClick={() => setActiveTab('generate')}
          style={{
            padding: '10px 20px',
            background: activeTab === 'generate' ? '#2563eb' : 'transparent',
            color: activeTab === 'generate' ? 'white' : '#333',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Generate
        </button>
        <button
          onClick={() => setActiveTab('gallery')}
          style={{
            padding: '10px 20px',
            background: activeTab === 'gallery' ? '#2563eb' : 'transparent',
            color: activeTab === 'gallery' ? 'white' : '#333',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Gallery ({gallery.length})
        </button>
      </div>

      {activeTab === 'generate' ? (
        <>
          <div style={{ margin: '20px 0' }}>
            <label>Model: </label>
            <select 
              value={model} 
              onChange={(e) => setModel(e.target.value)}
              style={{ padding: '5px', marginLeft: '10px' }}
            >
              {MODELS.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your image..."
            style={{ width: '100%', minHeight: '100px', padding: '10px', marginBottom: '10px' }}
          />

          <button 
            onClick={generateImage} 
            disabled={loading}
            style={{ 
              padding: '10px 20px', 
              background: loading ? '#ccc' : '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'wait' : 'pointer'
            }}
          >
            {loading ? 'Generating...' : 'Generate Image'}
          </button>

          {error && <p style={{ color: 'red', marginTop: '10px' }}>Error: {error}</p>}

          {currentImage && (
            <div style={{ marginTop: '20px' }}>
              <h3>Current Image</h3>
              <img 
                src={currentImage} 
                alt="Generated from prompt" 
                style={{ 
                  maxWidth: '100%', 
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }} 
              />
              <a
                href={currentImage}
                download={`generated-${Date.now()}.png`}
                style={{
                  display: 'inline-block',
                  marginTop: '10px',
                  padding: '5px 10px',
                  background: '#10b981',
                  color: 'white',
                  borderRadius: '4px',
                  textDecoration: 'none'
                }}
              >
                Download Image
              </a>
            </div>
          )}
        </>
      ) : (
        <div>
          <h2>Generated Images ({gallery.length})</h2>
          {gallery.length === 0 ? (
            <p>No images generated yet. Create some in the Generate tab!</p>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: '20px',
              marginTop: '20px'
            }}>
              {gallery.map((item, index) => (
                <div key={index} style={{
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  padding: '10px'
                }}>
                  <img 
                    src={item.image} 
                    alt={`Generated: ${item.prompt}`}
                    style={{
                      width: '100%',
                      height: 'auto',
                      borderRadius: '4px'
                    }}
                  />
                  <div style={{ marginTop: '10px' }}>
                    <p><strong>Prompt:</strong> {item.prompt}</p>
                    <p><small>Model: {MODELS.find(m => m.id === item.model)?.name || item.model}</small></p>
                    <p><small>Created: {item.date}</small></p>
                    <a
                      href={item.image}
                      download={`generated-${index}-${Date.now()}.png`}
                      style={{
                        display: 'inline-block',
                        marginTop: '10px',
                        padding: '5px 10px',
                        background: '#10b981',
                        color: 'white',
                        borderRadius: '4px',
                        textDecoration: 'none',
                        fontSize: '14px'
                      }}
                    >
                      Download
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Texty;
