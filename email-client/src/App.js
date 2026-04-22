import React, { useState, useEffect } from 'react';
import Confetti from 'react-confetti';
import CryptoJS from 'crypto-js';
import './App.css';

const UPI_ID = '9113691203@ybl';
const SECRET_KEY = '12345678901234567890123456789012';

function App() {
  const [formData, setFormData] = useState({
    from: '',
    to: '',
    cc: '',
    bcc: '',
    subject: '',
    body: '',
    smtpHost: '',
    smtpPort: 587,
    username: '',
    password: '',
    useTls: true
  });
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [donationAmount, setDonationAmount] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const wrapText = (tag, textarea) => {
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = formData.body;
    const selectedText = text.substring(start, end) || 'text';
    
    let newText;
    if (tag === 'b') {
      newText = text.substring(0, start) + '**' + selectedText + '**' + text.substring(end);
    } else if (tag === 'i') {
      newText = text.substring(0, start) + '_' + selectedText + '_' + text.substring(end);
    } else {
      newText = text.substring(0, start) + '\n' + selectedText + '\n' + text.substring(end);
    }
    
    setFormData(prev => ({ ...prev, body: newText }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResponse(null);
    setShowConfetti(false);
    setShowErrorModal(false);
    setShowPaymentForm(false);

    try {
      const encrypted = CryptoJS.AES.encrypt(JSON.stringify(formData), SECRET_KEY).ciphertext.toString();
      
      const formDataToSend = new FormData();
      formDataToSend.append('encrypted', encrypted);
      
      if (attachments.length > 0) {
        attachments.forEach(file => {
          formDataToSend.append('files', file);
        });
      }
      
      const endpoint = attachments.length > 0 
        ? 'http://localhost:8080/api/mail/send-with-attachments' 
        : 'http://localhost:8080/api/mail/send';
      
      const res = await fetch(endpoint, {
        method: 'POST',
        body: formDataToSend
      });
      
      const data = await res.json();
      setResponse(data);
      
      if (res.ok) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
      } else {
        setShowErrorModal(true);
      }
    } catch (error) {
      setResponse({ status: 'error', message: error.message });
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const closeErrorModal = () => {
    setShowErrorModal(false);
  };

  const resetForm = () => {
    setFormData({
      from: '',
      to: '',
      cc: '',
      bcc: '',
      subject: '',
      body: '',
      smtpHost: formData.smtpHost,
      smtpPort: formData.smtpPort,
      username: formData.username,
      password: formData.password,
      useTls: formData.useTls
    });
    setAttachments([]);
    setResponse(null);
  };

  const generateUPIQRCode = (amount) => {
    if (!amount) return '';
    const upiUrl = `upi://pay?pa=${UPI_ID}&pn=Email%20Sender%20App&am=${amount}&cu=INR`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUrl)}`;
  };

  return (
    <div className="app-wrapper">
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={500}
          gravity={0.2}
          colors={['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']}
        />
      )}
      
      <header className="main-header">
        <div className="header-brand">
          <div className="brand-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          </div>
          <div className="brand-text">
            <h1>Ghost Mailer</h1>
            <span>by NEONIX</span>
          </div>
        </div>
        <p className="header-tagline">Send emails securely with your own SMTP server</p>
      </header>

      <main className="main-content">
        <div className="content-grid">
          <section className="email-form-section">
            <form onSubmit={handleSubmit}>
              <div className="form-card">
                <div className="form-card-header">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                  </svg>
                  <h2>SMTP Configuration</h2>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>SMTP Host</label>
                    <input type="text" name="smtpHost" value={formData.smtpHost} onChange={handleChange} placeholder="smtp.gmail.com" required />
                  </div>
                  <div className="form-group">
                    <label>SMTP Port</label>
                    <input type="number" name="smtpPort" value={formData.smtpPort} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label>Username</label>
                    <input type="text" name="username" value={formData.username} onChange={handleChange} placeholder="your.email@gmail.com" required />
                  </div>
                  <div className="form-group">
                    <label>Password</label>
                    <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="App password" required />
                  </div>
                </div>
                <div className="form-group toggle-group">
                  <label className="toggle-label">
                    <span className="toggle-switch">
                      <input type="checkbox" name="useTls" checked={formData.useTls} onChange={handleChange} />
                      <span className="slider"></span>
                    </span>
                    <span>Use TLS Encryption</span>
                  </label>
                </div>
              </div>

              <div className="form-card">
                <div className="form-card-header">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                  <h2>Email Details</h2>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>From</label>
                    <input type="email" name="from" value={formData.from} onChange={handleChange} placeholder="sender@gmail.com" required />
                  </div>
                  <div className="form-group">
                    <label>To</label>
                    <input type="text" name="to" value={formData.to} onChange={handleChange} placeholder="a@example.com, b@example.com" />
                  </div>
                  <div className="form-group">
                    <label>CC</label>
                    <input type="text" name="cc" value={formData.cc} onChange={handleChange} placeholder="cc1@example.com, cc2@example.com" />
                  </div>
                  <div className="form-group">
                    <label>BCC</label>
                    <input type="text" name="bcc" value={formData.bcc} onChange={handleChange} placeholder="bcc1@example.com, bcc2@example.com" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Subject</label>
                  <input type="text" name="subject" value={formData.subject} onChange={handleChange} placeholder="Enter email subject..." required />
                </div>
                <div className="form-group">
                  <label>Message</label>
                  <div className="rich-editor">
                    <div className="editor-toolbar">
                      <button type="button" className="toolbar-btn" onClick={(e) => wrapText('b', e.target.closest('.rich-editor').querySelector('textarea'))} title="Bold">
                        <strong>B</strong>
                      </button>
                      <button type="button" className="toolbar-btn italic-btn" onClick={(e) => wrapText('i', e.target.closest('.rich-editor').querySelector('textarea'))} title="Italic">
                        <em>I</em>
                      </button>
                      <label className="attach-btn" title="Attach File">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21.44 11.05l-9.09 9.09a6 6 0 0 1-8.49-8.49l9.09-9.09a4 4 0 0 1 5.66 5.66l-9.09 9.09a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                        </svg>
                        <input type="file" multiple onChange={handleFileChange} hidden />
                      </label>
                    </div>
                    <textarea 
                      name="body" 
                      value={formData.body} 
                      onChange={handleChange} 
                      rows="6" 
                      placeholder="Write your message here... (Use **text** for bold, _text_ for italic)"
                      required 
                    />
                  </div>
                  {attachments.length > 0 && (
                    <div className="attachments-list">
                      {attachments.map((file, index) => (
                        <div key={index} className="attachment-item">
                          <span>{file.name}</span>
                          <button type="button" onClick={() => removeAttachment(index)}>×</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <button type="submit" disabled={loading} className="send-btn">
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Sending...
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="22" y1="2" x2="11" y2="13"/>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                    Send Email
                  </>
                )}
              </button>

              {response && !showErrorModal && (
                <div className="toast success-toast">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                  <span>{response.message}</span>
                  <button onClick={resetForm}>New Email</button>
                </div>
              )}

              {showErrorModal && (
                <div className="toast error-toast">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                  </svg>
                  <span>{response?.message || 'Email failed to send'}</span>
                </div>
              )}
            </form>
          </section>

          <aside className="sidebar">
            <div className="info-card about-card">
              <div className="info-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 16v-4"/>
                  <path d="M12 8h.01"/>
                </svg>
              </div>
              <h3>About Ghost Mailer</h3>
              <p>Send emails securely using your own SMTP server. Configure Gmail, Outlook, or any provider to send emails directly.</p>
            </div>

            <div className="info-card">
              <h3>SMTP Setup Guide</h3>
              <div className="guide-links">
                <a href="https://www.geeksforgeeks.org/techtips/how-to-use-the-gmail-smtp-server-to-send-emails-for-free/" target="_blank" rel="noopener noreferrer" className="guide-link">
                  <span className="guide-icon gmail">G</span>
                  <span>Gmail SMTP</span>
                </a>
                <a href="https://support.microsoft.com/en-us/office/server-settings-you-ll-need-from-your-email-provider-c82de912-adcc-4787-8283-45a1161f3cc3" target="_blank" rel="noopener noreferrer" className="guide-link">
                  <span className="guide-icon outlook">O</span>
                  <span>Outlook SMTP</span>
                </a>
              </div>
            </div>

            <div className="info-card features-card">
              <h3>Why Choose Ghost Mailer?</h3>
              <div className="features-list">
                <div className="feature-item">
                  <div className="feature-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                  </div>
                  <p>Use your own custom from email address</p>
                </div>
                <div className="feature-item">
                  <div className="feature-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </div>
                  <p>End-to-end encrypted data transfer</p>
                </div>
              </div>
            </div>

            <button className="donate-btn" onClick={() => setShowPaymentForm(!showPaymentForm)}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
              Help Us Grow!
            </button>

            {showPaymentForm && (
              <div className="payment-card">
                <h3>Support Our Work</h3>
                <p>Enter amount and scan to pay via UPI</p>
                <div className="amount-input">
                  <span className="currency">₹</span>
                  <input 
                    type="number" 
                    placeholder="Amount" 
                    value={donationAmount}
                    onChange={(e) => setDonationAmount(e.target.value)}
                    onWheel={(e) => e.target.blur()}
                  />
                </div>
                {donationAmount && donationAmount !== '' && parseInt(donationAmount) < 10 && (
                  <p className="amount-error">Minimum amount is ₹10</p>
                )}
                {donationAmount && donationAmount !== '' && parseInt(donationAmount) >= 10 && (
                  <div className="qr-display">
                    <img src={generateUPIQRCode(donationAmount)} alt="UPI QR" />
                    <p className="upi-id">UPI: {UPI_ID}</p>
                  </div>
                )}
              </div>
            )}
          </aside>
        </div>
      </main>

      <footer className="main-footer">
        <div className="footer-content">
          <span className="footer-brand">NEONIX</span>
          <span className="footer-sep">|</span>
          <span className="footer-copy">© 2026 NEONIX. All rights reserved.</span>
          <span className="footer-sep">|</span>
          <span className="footer-by">By N P Group</span>
        </div>
      </footer>

      {showErrorModal && (
        <div className="modal-overlay" onClick={closeErrorModal}>
          <div className="error-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-icon error">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            </div>
            <h2>Email Failed</h2>
            <p>{response?.message || 'Please check your SMTP settings and try again.'}</p>
            <button onClick={closeErrorModal}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
