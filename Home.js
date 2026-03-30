import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot, faPaperPlane, faTimes, faStar, faMessage, faCalendarCheck } from '@fortawesome/free-solid-svg-icons';
import './Home.css';

const API_BASE_URL = 'http://localhost:5000/api';

function Home() {
  const [hostels, setHostels] = useState([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [chatStep, setChatStep] = useState('email'); 
  const [userEmail, setUserEmail] = useState('');
  const [rejectionCount, setRejectionCount] = useState(0);

  const [chatData, setChatData] = useState({ 
    budget: 16000, 
    roomType: 'Girls',
    amenities: { studio: false, kitchen: false, garden: false, balcony: false }
  });

  const [messages, setMessages] = useState([
    { sender: 'bot', text: "Hi there! I'm your elite AI Leasing Agent. What is your email so I can secure your spot?", isCard: false }
  ]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const fetchHostels = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/public/hostels`);
        setHostels(res.data);
      } catch (err) {
        console.error("Failed to load properties", err);
      }
    };
    fetchHostels();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatStep]);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!userEmail.includes('@')) return alert("Enter a valid email");
    
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/start-chat`, { identifier: userEmail });
      setMessages(prev => [
        ...prev, 
        { sender: 'user', text: userEmail, isCard: false },
        { sender: 'bot', text: "Thanks! Roughly, what is your maximum monthly budget?", isCard: false }
      ]);
      setChatStep('budget');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleBudgetSelect = (label, value) => {
    setChatData({ ...chatData, budget: value });
    setRejectionCount(0); 
    setMessages(prev => [
      ...prev,
      { sender: 'user', text: label, isCard: false },
      { sender: 'bot', text: "Got it. And what type of accommodation are you looking for?", isCard: false }
    ]);
    setChatStep('type');
  };

  const handleTypeSelect = (type) => {
    setChatData({ ...chatData, roomType: type });
    setMessages(prev => [
      ...prev,
      { sender: 'user', text: type, isCard: false },
      { sender: 'bot', text: "Perfect. Tap any must-have amenities you need, then click 'Search Properties'.", isCard: false }
    ]);
    setChatStep('amenities');
  };

  const toggleAmenity = (key) => {
    setChatData(prev => ({
      ...prev,
      amenities: { ...prev.amenities, [key]: !prev.amenities[key] }
    }));
  };

  const handleSearchClick = () => {
    setMessages(prev => [
      ...prev,
      { sender: 'user', text: "Find my matches!", isCard: false },
      { sender: 'bot', text: "Searching our premium database for your absolute best match...", isCard: false }
    ]);
    fetchRecommendation(chatData.roomType, chatData.amenities, 0);
  };

  const fetchRecommendation = async (type, selectedAmenities, currentRejectionCount) => {
    setChatStep('fetching');
    try {
      const payload = {
        budget: chatData.budget,
        room_type: type,
        rejection_count: currentRejectionCount,
        is_studio: selectedAmenities.studio ? 'yes' : 'no',
        has_kitchen: selectedAmenities.kitchen ? 'yes' : 'no',
        has_garden: selectedAmenities.garden ? 'yes' : 'no',
        has_balcony: selectedAmenities.balcony ? 'yes' : 'no'
      };

      const response = await axios.post(`${API_BASE_URL}/get-recommendation`, payload);
      const data = response.data;

      if (data.out_of_options) {
        setMessages(prev => [...prev, { sender: 'bot', text: data.message, isCard: false }]);
        setChatStep('out_of_options');
      } else {
        setMessages(prev => [
          ...prev, 
          { sender: 'bot', text: data.message, isCard: data.is_card, hostel: data.hostels ? data.hostels[0] : null }
        ]);
        setChatStep('done');
      }
    } catch (error) {
      setMessages(prev => [...prev, { sender: 'bot', text: "Connection error. Let's try again.", isCard: false }]);
      setChatStep('done');
    }
  };

  const handleRejectHostel = () => {
    const newCount = rejectionCount + 1;
    setRejectionCount(newCount);
    setMessages(prev => [
      ...prev,
      { sender: 'user', text: "Not quite my style. Show me another.", isCard: false },
      { sender: 'bot', text: "No problem. Let me pull up the next best property in our portfolio.", isCard: false }
    ]);
    fetchRecommendation(chatData.roomType, chatData.amenities, newCount);
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    const dateTime = e.target.visitDate.value;
    
    const formattedDate = new Date(dateTime).toLocaleString('en-IN', { 
      weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' 
    });

    const lastRecommendedHostel = messages.slice().reverse().find(m => m.isCard && m.hostel)?.hostel?.name || "Unknown Property";

    try {
      await axios.post(`${API_BASE_URL}/book-visit`, {
        email: userEmail,
        hostel_name: lastRecommendedHostel,
        visit_date: formattedDate
      });

      setMessages(prev => [
        ...prev,
        { sender: 'user', text: `I want to visit on ${formattedDate}`, isCard: false },
        { sender: 'bot', text: `Fantastic! 🎉 Your VIP viewing at ${lastRecommendedHostel} is officially booked for ${formattedDate}. We've emailed the details to ${userEmail}. See you there!`, isCard: false }
      ]);
      setChatStep('finished');
    } catch (error) {
      alert("Error saving your booking. Please try again.");
    }
  };

  return (
    <div className="home-container">
      <nav className="home-navbar">
        <div className="logo">Hostel<span>Safe</span></div>
        {/* Admin Link removed for privacy */}
      </nav>

      <main className="listing-section">
        <h1>Explore Top Properties</h1>
        <p>Verified, safe, and comfortable accommodations tailored for you.</p>
        
        <div className="property-grid">
          {hostels.map(h => (
            <div className="property-card" key={h.id}>
              <img src={h.image || "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&q=80&w=600"} alt={h.name} className="property-img" />
              <div className="property-info">
                <div className="property-header">
                  <h3>{h.name}</h3>
                  <span className="rating"><FontAwesomeIcon icon={faStar} /> {h.rating}</span>
                </div>
                <div className="property-type">{h.type}</div>
                <div className="property-price">₹{h.price} <span style={{fontSize: '0.8rem', color: '#64748b', fontWeight: 'normal'}}>/ month</span></div>
                <p style={{fontSize: '0.85rem', color: '#64748b'}}>{h.specs}</p>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* FLOATING CHAT WIDGET */}
      {!isChatOpen && (
        <button className="chat-widget-btn" onClick={() => setIsChatOpen(true)}>
          <FontAwesomeIcon icon={faMessage} />
        </button>
      )}

      {isChatOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <div><FontAwesomeIcon icon={faRobot} style={{marginRight: '8px'}}/> AI Sales Agent</div>
            <button className="close-chat" onClick={() => setIsChatOpen(false)}><FontAwesomeIcon icon={faTimes} /></button>
          </div>
          
          <div className="chat-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`message ${msg.sender}`}>
                <p>{msg.text}</p>
                {msg.isCard && msg.hostel && (
                  <div style={{marginTop: '10px', background: '#f1f5f9', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', color: 'black', border: '1px solid #e2e8f0'}}>
                    <img src={msg.hostel.image || "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&q=80&w=600"} alt="hostel" style={{width: '100%', height: '120px', objectFit: 'cover', borderRadius: '4px', marginBottom: '8px'}} />
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px'}}>
                        <strong style={{fontSize: '1rem'}}>{msg.hostel.name}</strong>
                        <span style={{color: '#f59e0b'}}><FontAwesomeIcon icon={faStar} /> {msg.hostel.rating}</span>
                    </div>
                    <div style={{color: '#dc2626', fontWeight: 'bold', marginBottom: '8px', fontSize: '0.8rem'}}>{msg.hostel.avail_label}</div>
                    <span style={{color: '#2563eb', fontWeight: '800', fontSize: '1.1rem'}}>₹{msg.hostel.price}/mo</span>
                    <p style={{marginTop: '6px', color: '#475569'}}>{msg.hostel.specs}</p>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-area">
            {chatStep === 'email' && (
              <form className="email-input-form" onSubmit={handleEmailSubmit}>
                <input type="email" placeholder="Type your email..." value={userEmail} onChange={(e) => setUserEmail(e.target.value)} required />
                <button type="submit" disabled={loading}><FontAwesomeIcon icon={faPaperPlane} /></button>
              </form>
            )}

            {chatStep === 'budget' && (
              <div className="pill-container">
                <button className="btn-pill" onClick={() => handleBudgetSelect("Under ₹10,000", 9000)}>Under ₹10k</button>
                <button className="btn-pill" onClick={() => handleBudgetSelect("Around ₹15,000", 15000)}>Around ₹15k</button>
                <button className="btn-pill" onClick={() => handleBudgetSelect("Premium (₹20,000+)", 22000)}>Premium (₹20k+)</button>
              </div>
            )}

            {chatStep === 'type' && (
              <div className="pill-container">
                <button className="btn-pill" onClick={() => handleTypeSelect("Girls")}>Girls Hostel</button>
                <button className="btn-pill" onClick={() => handleTypeSelect("Boys")}>Boys Hostel</button>
                <button className="btn-pill" onClick={() => handleTypeSelect("Co-living")}>Co-living</button>
              </div>
            )}

            {chatStep === 'amenities' && (
              <div className="pill-container" style={{flexDirection: 'column'}}>
                <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap'}}>
                  <button className={`btn-pill ${chatData.amenities.studio ? 'active' : ''}`} onClick={() => toggleAmenity('studio')}>Studio</button>
                  <button className={`btn-pill ${chatData.amenities.kitchen ? 'active' : ''}`} onClick={() => toggleAmenity('kitchen')}>Kitchen</button>
                  <button className={`btn-pill ${chatData.amenities.garden ? 'active' : ''}`} onClick={() => toggleAmenity('garden')}>Garden</button>
                  <button className={`btn-pill ${chatData.amenities.balcony ? 'active' : ''}`} onClick={() => toggleAmenity('balcony')}>Balcony</button>
                </div>
                <button className="btn-primary" style={{marginTop: '10px'}} onClick={handleSearchClick}>Search Properties</button>
              </div>
            )}

            {chatStep === 'fetching' && (
              <div style={{textAlign: 'center', color: '#64748b', fontSize: '0.9rem'}}>Checking live inventory...</div>
            )}
            
            {chatStep === 'done' && (
              <div className="pill-container" style={{flexDirection: 'column'}}>
                <button 
                  className="btn-primary" 
                  style={{width: '100%', padding: '10px', background: '#0f172a', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold'}}
                  onClick={() => {
                    setMessages(prev => [...prev, { sender: 'bot', text: "Excellent choice! When would you like to drop by for a visit?", isCard: false }]);
                    setChatStep('booking');
                  }}
                >
                  Yes, Book a Viewing Now!
                </button>
                <button className="btn-pill" style={{width: '100%', background: 'transparent', border: '1px solid #e2e8f0', color: '#64748b'}} onClick={handleRejectHostel}>
                  Not my style. Show me another.
                </button>
              </div>
            )}

            {chatStep === 'booking' && (
              <form style={{display: 'flex', flexDirection: 'column', gap: '10px'}} onSubmit={handleBookingSubmit}>
                <input type="datetime-local" name="visitDate" required style={{padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontFamily: 'inherit'}} />
                <button type="submit" className="btn-primary" style={{background: '#10b981'}}>
                  <FontAwesomeIcon icon={faCalendarCheck} style={{marginRight: '8px'}} /> Confirm Appointment
                </button>
              </form>
            )}

            {chatStep === 'finished' && (
              <div style={{textAlign: 'center', color: '#10b981', fontSize: '0.95rem', fontWeight: 'bold'}}>
                Appointment Confirmed!
              </div>
            )}

            {chatStep === 'out_of_options' && (
              <button className="btn-primary" style={{width: '100%', padding: '10px', background: '#2563eb', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold'}} onClick={() => {
                setChatStep('budget');
                setRejectionCount(0);
                setMessages(prev => [...prev, { sender: 'bot', text: "Let's adjust your budget. What range are we looking at now?", isCard: false }]);
              }}>
                Adjust My Filters
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;