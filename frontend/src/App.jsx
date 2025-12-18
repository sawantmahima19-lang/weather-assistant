import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

function App() {
  const [messages, setMessages] = useState([
    { 
      text: "Hello! I can tell you real-time weather for any city worldwide 🌍", 
      sender: 'bot' 
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Ref for auto-scrolling to latest message
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    // Add user message
    setMessages(prev => [...prev, { text: input, sender: 'user' }]);
    setInput('');
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:8001/chat', {
        text: input
      });

      // Add bot response
      setMessages(prev => [...prev, { 
        text: response.data.response, 
        sender: 'bot' 
      }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        text: "Error connecting to backend. Make sure it's running on port 8001.", 
        sender: 'bot' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage();
  };

  const exampleQueries = [
    "What's the weather in Tokyo?",
    "Temperature in New York",
    "How is weather in Paris, France?",
    "Weather in Dubai today",
    "Is it raining in London?"
  ];

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>🌤️ Weather Assistant</h1>
          <p style={styles.subtitle}>Get real-time weather for any city worldwide</p>
        </div>

        {/* Search Bar - CENTERED */}
        <div style={styles.searchSection}>
          <form onSubmit={handleSubmit} style={styles.searchForm}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about weather in any city..."
              style={styles.searchInput}
              disabled={loading}
            />
            <button 
              type="submit" 
              style={styles.searchButton}
              disabled={loading || !input.trim()}
            >
              {loading ? '...' : 'Search'}
            </button>
          </form>
          
          {/* Weather Hints */}
          <div style={styles.hints}>
            <p style={styles.hintsTitle}>Try asking:</p>
            <div style={styles.hintButtons}>
              {exampleQueries.map((query, index) => (
                <button
                  key={index}
                  style={styles.hintButton}
                  onClick={() => {
                    setInput(query);
                    setTimeout(() => {
                      const event = new Event('submit', { bubbles: true });
                      document.querySelector('form').dispatchEvent(event);
                    }, 100);
                  }}
                  disabled={loading}
                >
                  {query}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chat Messages - Auto-scrolls to latest */}
        <div style={styles.chatContainer}>
          {messages.map((msg, index) => (
            <div 
              key={index} 
              style={{
                ...styles.message,
                ...(msg.sender === 'user' ? styles.userMessage : styles.botMessage)
              }}
            >
              {msg.text}
            </div>
          ))}
          {loading && <div style={styles.loading}>Getting weather data...</div>}
          {/* This invisible div is where we scroll to */}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
}

// Styles with centered search
const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  content: {
    width: '100%',
    maxWidth: '800px',
    background: 'white',
    borderRadius: '20px',
    padding: '30px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
    height: '90vh',
    display: 'flex',
    flexDirection: 'column'
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px',
    flexShrink: 0
  },
  title: {
    color: '#2c3e50',
    marginBottom: '10px',
    fontSize: '2.5rem'
  },
  subtitle: {
    color: '#7f8c8d',
    fontSize: '1.1rem'
  },
  // Centered Search Section
  searchSection: {
    marginBottom: '20px',
    flexShrink: 0
  },
  searchForm: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px'
  },
  searchInput: {
    flex: 1,
    padding: '15px 20px',
    border: '2px solid #e0e0e0',
    borderRadius: '25px',
    fontSize: '16px',
    outline: 'none',
    transition: 'all 0.3s'
  },
  searchButton: {
    padding: '15px 30px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '25px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    minWidth: '100px',
    transition: 'all 0.3s'
  },
  // Hints Section
  hints: {
    textAlign: 'center'
  },
  hintsTitle: {
    color: '#666',
    marginBottom: '15px',
    fontSize: '14px',
    fontWeight: '500'
  },
  hintButtons: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    justifyContent: 'center'
  },
  hintButton: {
    padding: '10px 20px',
    background: '#f8f9fa',
    border: '1px solid #e0e0e0',
    borderRadius: '20px',
    color: '#667eea',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.3s'
  },
  // Chat Container - Scrollable
  chatContainer: {
    background: '#f8f9fa',
    borderRadius: '15px',
    padding: '25px',
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column'
  },
  message: {
    padding: '15px',
    margin: '10px 0',
    borderRadius: '15px',
    maxWidth: '85%',
    wordWrap: 'break-word',
    lineHeight: '1.5'
  },
  userMessage: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    marginLeft: 'auto',
    textAlign: 'right'
  },
  botMessage: {
    background: 'white',
    color: '#333',
    marginRight: 'auto',
    borderLeft: '4px solid #667eea',
    whiteSpace: 'pre-line'
  },
  loading: {
    textAlign: 'center',
    color: '#667eea',
    padding: '20px',
    fontSize: '16px'
  }
};

// Add hover effects
const buttonHover = {
  transform: 'translateY(-2px)',
  boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)'
};

const hintButtonHover = {
  background: '#667eea',
  color: 'white',
  borderColor: '#667eea',
  transform: 'translateY(-2px)'
};

// Apply hover styles
Object.assign(styles.searchButton, {
  ':hover': buttonHover,
  ':disabled': { opacity: 0.5, cursor: 'not-allowed', transform: 'none' }
});

Object.assign(styles.hintButton, {
  ':hover': hintButtonHover,
  ':disabled': { opacity: 0.5, cursor: 'not-allowed', transform: 'none' }
});

Object.assign(styles.searchInput, {
  ':focus': {
    borderColor: '#667eea',
    boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)'
  }
});

export default App;