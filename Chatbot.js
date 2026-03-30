import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const Chatbot = () => {
  const [step, setStep] = useState(0);
  const [userData, setUserData] = useState({ 
    identifier: '', budget: '', room_type: '', 
    is_studio: false, has_kitchen: false, has_garden: false, has_balcony: false 
  });
  const [chatLog, setChatLog] = useState([{ sender: 'bot', text: 'Namaste! Please enter your Email to begin.' }]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => { scrollToBottom(); }, [chatLog, loading]);

  const handleIdentifier = async (e) => {
    e.preventDefault();
    if (!userData.identifier.includes('@')) return alert("Enter valid email");
    try {
      const res = await axios.post('http://localhost:5000/api/start-chat', { identifier: userData.identifier });
      setUserData(prev => ({ ...prev, user_id: res.data.user_id }));
      setChatLog(prev => [...prev, 
        { sender: 'user', text: userData.identifier }, 
        { sender: 'bot', text: 'What is your monthly budget?' }
      ]);
      setStep(1);
    } catch (err) { alert("Error connecting to server."); }
  };

  const handleSelection = (field, value, nextMsg) => {
    const updatedData = { ...userData, [field]: value };
    setUserData(updatedData);

    let displayValue = value === true ? "Yes" : value === false ? "No" : field === 'budget' ? `₹${value}` : value;
    setChatLog(prev => [...prev, { sender: 'user', text: displayValue }]);

    if (field === 'has_balcony') {
      setStep(7); // Final step
      fetchRecommendation(updatedData);
    } else {
      setLoading(true);
      setTimeout(() => {
        setChatLog(prev => [...prev, { sender: 'bot', text: nextMsg }]);
        setStep(prev => prev + 1);
        setLoading(false);
      }, 600);
    }
  };

  const fetchRecommendation = async (finalData) => {
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/get-recommendation', finalData);
      setChatLog(prev => [...prev, { sender: 'bot', text: res.data.message, hostels: res.data.hostels }]);
    } catch (err) { 
      setChatLog(prev => [...prev, { sender: 'bot', text: "Unable to fetch recommendation. Please try again later." }]); 
    }
    setLoading(false);
  };

  // Styles are placed outside or at the bottom for readability
  return (
    <div style={containerStyle}>
      <div style={headerStyle}>HostelSafe AI Assistant</div>
      <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', height: '450px' }}>
        
        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '10px' }}>
          {chatLog.map((m, i) => (
            <div key={i} style={{ textAlign: m.sender === 'bot' ? 'left' : 'right', margin: '15px 0' }}>
              {!m.hostels ? (
                <span style={{ 
                  background: m.sender === 'bot' ? '#f0f0f0' : '#003366', 
                  color: m.sender === 'bot' ? 'black' : 'white', 
                  padding: '10px 15px', borderRadius: '12px', display: 'inline-block', maxWidth: '80%', fontSize: '14px' 
                }}>{m.text}</span>
              ) : (
                <div style={{ textAlign: 'left' }}>
                  <p style={{ fontSize: '14px', color: '#333', marginBottom: '10px', lineHeight: '1.4' }}>{m.text}</p>
                  {m.hostels.map((h, idx) => (
                    <div key={idx} style={cardStyle}>
                      <img src={h.image} alt="hostel" style={{ width: '100%', height: '130px', objectFit: 'cover' }} />
                      <div style={{ padding: '12px' }}>
                        <h4 style={{ margin: '0', fontSize: '15px', color: '#003366' }}>{h.name}</h4>
                        <div style={{ fontSize: '12px', margin: '5px 0' }}>
                            <b>Rent:</b> ₹{h.price}/mo <br /> 
                            <span style={{ color: '#d9534f', fontWeight: 'bold' }}>{h.avail_label}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '5px', marginTop: '10px' }}>
                          <button style={btnActionEnquire} onClick={() => alert("Enquiry sent!")}>Enquiry</button>
                          <button style={btnActionBook} onClick={() => alert("Booking...")}>Book Now</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {loading && <p style={{ fontSize: '12px', color: '#888' }}>Thinking...</p>}
          <div ref={messagesEndRef} />
        </div>

        <div style={{ borderTop: '1px solid #eee', paddingTop: '10px' }}>
          {step === 0 && (
            <form onSubmit={handleIdentifier} style={{ display: 'flex' }}>
              <input style={inputStyle} type="email" placeholder="Enter Email" required
                onChange={(e) => setUserData({ ...userData, identifier: e.target.value })} />
              <button type="submit" style={btnPrimary}>Next</button>
            </form>
          )}
          {step === 1 && <div style={btnGroup}>{['12000', '16000', '25000'].map(b => <button key={b} style={btnOption} onClick={() => handleSelection('budget', b, 'Looking for Boys or Girls?')}>₹{b}</button>)}</div>}
          {step === 2 && <div style={btnGroup}><button style={btnOption} onClick={() => handleSelection('room_type', 'Boys', 'Prefer a Studio room?')}>Boys</button><button style={btnOption} onClick={() => handleSelection('room_type', 'Girls', 'Prefer a Studio room?')}>Girls</button></div>}
          {step === 3 && <div style={btnGroup}><button style={btnOption} onClick={() => handleSelection('is_studio', true, 'Need a Kitchen?')}>Yes</button><button style={btnOption} onClick={() => handleSelection('is_studio', false, 'Need a Kitchen?')}>No</button></div>}
          {step === 4 && <div style={btnGroup}><button style={btnOption} onClick={() => handleSelection('has_kitchen', true, 'Need a Garden?')}>Yes</button><button style={btnOption} onClick={() => handleSelection('has_kitchen', false, 'Need a Garden?')}>No</button></div>}
          {step === 5 && <div style={btnGroup}><button style={btnOption} onClick={() => handleSelection('has_garden', true, 'Need a Balcony?')}>Yes</button><button style={btnOption} onClick={() => handleSelection('has_garden', false, 'Need a Balcony?')}>No</button></div>}
          {step === 6 && <div style={btnGroup}><button style={btnOption} onClick={() => handleSelection('has_balcony', true, 'Finding matches...')}>Yes</button><button style={btnOption} onClick={() => handleSelection('has_balcony', false, 'Finding matches...')}>No</button></div>}
          {step === 7 && !loading && <button style={{ ...btnPrimary, width: '100%' }} onClick={() => window.location.reload()}>New Search</button>}
        </div>
      </div>
    </div>
  );
};

// --- Styles ---
const containerStyle = { position: 'fixed', bottom: '20px', right: '20px', width: '350px', background: '#fff', borderRadius: '15px', boxShadow: '0 5px 25px rgba(0,0,0,0.2)', zIndex: '1000', fontFamily: 'sans-serif' };
const headerStyle = { background: '#003366', color: '#fff', padding: '15px', fontWeight: 'bold', borderRadius: '15px 15px 0 0' };
const cardStyle = { background: 'white', borderRadius: '12px', border: '1px solid #ddd', overflow: 'hidden', marginTop: '10px' };
const btnPrimary = { background: '#003366', color: '#fff', padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer' };
const btnOption = { flex: '1 1 30%', padding: '8px', border: '1px solid #003366', borderRadius: '20px', background: '#fff', color: '#003366', cursor: 'pointer', fontSize: '12px' };
const btnGroup = { display: 'flex', gap: '8px', flexWrap: 'wrap' };
const inputStyle = { flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '5px', marginRight: '5px' };
const btnActionEnquire = { flex: 1, padding: '8px', border: '1px solid #003366', borderRadius: '6px', background: '#fff', color: '#003366', cursor: 'pointer' };
const btnActionBook = { flex: 1, padding: '8px', border: 'none', borderRadius: '6px', background: '#003366', color: '#fff', cursor: 'pointer' };

export default Chatbot;