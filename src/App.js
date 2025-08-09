import React, { useState, useRef, useEffect } from 'react';
import { registerUser, saveVideoRecord, loadUserProgress, loginUser } from './api';
import AdminDashboard from './AdminDashboard';

// Icons...

const ModusKlarApp = () => {
  // Prüfe ob Admin-Modus über URL-Parameter
  const urlParams = new URLSearchParams(window.location.search);
  const isAdminMode = urlParams.get('admin') === 'true';
  
  if (isAdminMode) {
    return <AdminDashboard />;
  }
  
  // ... rest des Codes
  }
  
  // ... rest des bisherigen Codes
// Einfache Icon-Komponenten mit Emojis
const Icon = ({ children, className, onClick }) => (
  <span className={className} onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
    {children}
  </span>
);

const Camera = (props) => <Icon {...props}>📷</Icon>;
const CheckCircle = (props) => <Icon {...props}>✅</Icon>;
const XCircle = (props) => <Icon {...props}>❌</Icon>;
const Calendar = (props) => <Icon {...props}>📅</Icon>;
const Euro = (props) => <Icon {...props}>💶</Icon>;
const Shield = (props) => <Icon {...props}>🛡️</Icon>;
const Clock = (props) => <Icon {...props}>⏰</Icon>;
const Play = (props) => <Icon {...props}>▶️</Icon>;
const Square = (props) => <Icon {...props}>⏹️</Icon>;
const Home = (props) => <Icon {...props}>🏠</Icon>;
const FileText = (props) => <Icon {...props}>📄</Icon>;
const HelpCircle = (props) => <Icon {...props}>❓</Icon>;
const Bell = (props) => <Icon {...props}>🔔</Icon>;
const AlertCircle = (props) => <Icon {...props}>⚠️</Icon>;
const CreditCard = (props) => <Icon {...props}>💳</Icon>;

// Haupt-App Komponente
const ModusKlarApp = () => {
  // State Management
  const [currentScreen, setCurrentScreen] = useState('welcome');
  const [currentDay, setCurrentDay] = useState(1);
  const [todayVideos, setTodayVideos] = useState({ morning: null, evening: null });
  const [monthProgress, setMonthProgress] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [currentVideoType, setCurrentVideoType] = useState(null);
  const [showTerms, setShowTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [userId, setUserId] = useState(null);
  const [userData, setUserData] = useState({ 
    name: '', 
    email: '', 
    idNumber: '',
    idVerified: false,
    agreed: false,
    challengeStartDate: null,
    notificationsEnabled: false
  });
  const [timeWindow, setTimeWindow] = useState({ morning: false, evening: false });
  
  // Refs
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const recordingIntervalRef = useRef(null);

  // Styles
  const styles = {
    minHeight: { minHeight: '100vh' },
    gradient: { background: 'linear-gradient(to bottom right, #EBF8FF, #E9D8FD)' },
    container: { maxWidth: '28rem', margin: '0 auto', padding: '1rem' },
    card: { backgroundColor: 'white', borderRadius: '1rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', padding: '2rem' },
    button: { 
      background: 'linear-gradient(to right, #3B82F6, #9333EA)', 
      color: 'white', 
      padding: '0.75rem', 
      borderRadius: '0.5rem', 
      fontWeight: '600',
      border: 'none',
      cursor: 'pointer',
      width: '100%'
    },
    input: {
      width: '100%',
      padding: '0.75rem',
      border: '1px solid #D1D5DB',
      borderRadius: '0.5rem',
      marginBottom: '1rem',
      fontSize: '16px' // Verhindert Zoom auf iOS
    }
  };

  // Initial Load - Check für bestehenden User
  useEffect(() => {
    const checkExistingUser = async () => {
      const savedUserId = localStorage.getItem('userId');
      const savedUserName = localStorage.getItem('userName');
      
      if (savedUserId && savedUserName) {
        setUserId(savedUserId);
        setUserData(prev => ({ ...prev, name: savedUserName }));
        setCurrentScreen('dashboard');
        
        // Lade Fortschritt
        await loadProgress(savedUserId);
      }
    };
    
    checkExistingUser();
  }, []);

  // Zeitfenster-Check
  useEffect(() => {
    const checkTimeWindows = () => {
      const now = new Date();
      const hour = now.getHours();
      
      setTimeWindow({
        morning: hour >= 8 && hour < 12,
        evening: hour >= 18 && hour < 22
      });
    };
    
    checkTimeWindows();
    const interval = setInterval(checkTimeWindows, 60000); // Jede Minute prüfen
    return () => clearInterval(interval);
  }, []);

  // Fortschritts-Array generieren
  useEffect(() => {
    const progress = Array(28).fill(null).map((_, i) => {
      if (i < currentDay - 1) {
        return { day: i + 1, morning: 'verified', evening: 'verified' };
      } else if (i === currentDay - 1) {
        return { day: currentDay, morning: todayVideos.morning, evening: todayVideos.evening };
      }
      return { day: i + 1, morning: null, evening: null };
    });
    setMonthProgress(progress);
  }, [currentDay, todayVideos]);

  // Lade Nutzer-Fortschritt aus Datenbank
  const loadProgress = async (userId) => {
    try {
      const result = await loadUserProgress(userId);
      if (result.success && result.progress) {
        const completedDays = result.progress.filter(
          p => p.morning_status === 'verified' && p.evening_status === 'verified'
        ).length;
        setCurrentDay(completedDays + 1);
        
        const today = result.progress.find(p => p.day_number === completedDays + 1);
        if (today) {
          setTodayVideos({
            morning: today.morning_status,
            evening: today.evening_status
          });
        }
      }
    } catch (error) {
      console.error('Fehler beim Laden des Fortschritts:', error);
    }
  };

  // Registrierung Handler
  const handleRegistration = async () => {
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      const result = await registerUser(userData);
      
      if (result.success) {
        setUserId(result.user.id);
        localStorage.setItem('userId', result.user.id);
        localStorage.setItem('userName', result.user.name);
        setCurrentScreen('dashboard');
      } else {
        setErrorMessage('Registrierung fehlgeschlagen: ' + result.error);
      }
    } catch (error) {
      setErrorMessage('Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.');
    }
    
    setIsLoading(false);
  };

  // Logout Handler
  const handleLogout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    setUserId(null);
    setUserData({ 
      name: '', 
      email: '', 
      idNumber: '',
      idVerified: false,
      agreed: false,
      challengeStartDate: null,
      notificationsEnabled: false
    });
    setCurrentDay(1);
    setTodayVideos({ morning: null, evening: null });
    setCurrentScreen('welcome');
  };

  // Kamera-Funktionen
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' }, 
        audio: true 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      streamRef.current = stream;
    } catch (err) {
      console.error('Kamera-Zugriff verweigert:', err);
      alert('Bitte erlauben Sie den Kamera-Zugriff für diese App.');
      setCurrentScreen('dashboard');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    
    setIsRecording(true);
    setRecordingTime(0);
    
    const chunks = [];
    
    try {
      const options = { mimeType: 'video/webm' };
      mediaRecorderRef.current = new MediaRecorder(streamRef.current, options);
      
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      
      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        
        // Speichere Video-Eintrag in Datenbank
        if (userId) {
          const result = await saveVideoRecord(userId, currentVideoType, currentDay);
          
          if (result.success) {
            setTodayVideos(prev => ({
              ...prev,
              [currentVideoType]: 'pending'
            }));
            
            // Simuliere Verifikation nach 5 Sekunden
            setTimeout(() => {
              setTodayVideos(prev => ({
                ...prev,
                [currentVideoType]: 'verified'
              }));
            }, 5000);
          }
        }
      };
      
      mediaRecorderRef.current.start();
      
      // Timer für Aufnahmedauer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 30) {
            stopRecording();
            return 30;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (error) {
      console.error('Fehler beim Starten der Aufnahme:', error);
      alert('Fehler beim Starten der Aufnahme. Bitte versuchen Sie es erneut.');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    stopCamera();
    setCurrentScreen('dashboard');
  };

  // RENDER FUNCTIONS

  const renderWelcomeScreen = () => (
    <div style={{ ...styles.minHeight, ...styles.gradient, padding: '1rem' }}>
      <div style={styles.container}>
        <div style={{ ...styles.card, textAlign: 'center' }}>
          <div style={{ 
            width: '5rem', 
            height: '5rem', 
            background: 'linear-gradient(to right, #3B82F6, #9333EA)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            fontSize: '2.5rem'
          }}>
            <Shield />
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>Modus-Klar</h1>
          <p style={{ color: '#6B7280', marginBottom: '2rem' }}>
            4 Wochen alkoholfrei - Ein Präventionsprogramm unterstützt von Krankenkassen
          </p>
          
          <div style={{ textAlign: 'left', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem', marginBottom: '1rem' }}>
              <CheckCircle />
              <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>Eigenes Alkoholmessgerät erforderlich</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem', marginBottom: '1rem' }}>
              <CheckCircle />
              <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>2x täglich Messung per Video dokumentieren</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem', marginBottom: '1rem' }}>
              <CheckCircle />
              <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>Verifizierung durch geschultes Personal</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem' }}>
              <CheckCircle />
              <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>Prämie nach erfolgreicher Teilnahme</p>
            </div>
          </div>
          
          <div style={{ backgroundColor: '#DBEAFE', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
            <p style={{ fontSize: '0.75rem', color: '#6B7280' }}>
              Gefördert durch die gesetzlichen Krankenkassen als Präventionsmaßnahme nach § 20 SGB V
            </p>
          </div>
          
          <button
            onClick={() => setCurrentScreen('requirements')}
            style={styles.button}
          >
            Neue Registrierung starten
          </button>
              <button
  onClick={() => setCurrentScreen('login')}
  style={{
    ...styles.button,
    marginTop: '1rem',
    background: '#6B7280'
  }}
>
  Bereits registriert? Anmelden
</button>
        </div>
      </div>
    </div>
  );
const renderLoginScreen = () => {
    const [loginEmail, setLoginEmail] = useState('');
    const [loginError, setLoginError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async () => {
      setIsLoading(true);
      setLoginError('');
      
      const result = await loginUser(loginEmail);
      
      if (result.success) {
        setUserId(result.user.id);
        setUserData(result.user);
        setCurrentScreen('dashboard');
        loadProgress(result.user.id);
      } else {
        setLoginError(result.error);
      }
      
      setIsLoading(false);
    };

    return (
      <div style={{ ...styles.minHeight, ...styles.gradient, padding: '1rem' }}>
        <div style={styles.container}>
          <div style={styles.card}>
            <button 
              onClick={() => setCurrentScreen('welcome')}
              style={{ 
                background: 'none', 
                border: 'none', 
                fontSize: '1.5rem', 
                cursor: 'pointer',
                marginBottom: '1rem'
              }}
            >
              ←
            </button>
            
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Anmelden</h2>
            
            {loginError && (
              <div style={{ 
                backgroundColor: '#FEE2E2', 
                color: '#DC2626', 
                padding: '0.75rem', 
                borderRadius: '0.5rem', 
                marginBottom: '1rem',
                fontSize: '0.875rem'
              }}>
                {loginError}
              </div>
            )}
            
            <input
              type="email"
              placeholder="Ihre Email-Adresse"
              style={styles.input}
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            />
            
            <button
              onClick={handleLogin}
              style={{
                ...styles.button,
                ...(loginEmail && !isLoading
                  ? {}
                  : { background: '#D1D5DB', cursor: 'not-allowed' })
              }}
              disabled={!loginEmail || isLoading}
            >
              {isLoading ? 'Wird angemeldet...' : 'Anmelden'}
            </button>
          </div>
        </div>
      </div>
    );
  };
  const renderRequirementsScreen = () => (
    <div style={{ ...styles.minHeight, ...styles.gradient, padding: '1rem' }}>
      <div style={styles.container}>
        <div style={styles.card}>
          <button 
            onClick={() => setCurrentScreen('welcome')}
            style={{ 
              background: 'none', 
              border: 'none', 
              fontSize: '1.5rem', 
              cursor: 'pointer',
              marginBottom: '1rem'
            }}
          >
            ←
          </button>
          
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Voraussetzungen</h2>
          
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ backgroundColor: '#FEF3C7', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem' }}>
                <AlertCircle />
                <div>
                  <p style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Alkoholmessgerät erforderlich</p>
                  <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                    Sie benötigen ein eigenes, geprüftes Alkoholmessgerät. 
                    Empfohlene Modelle finden Sie in der App.
                  </p>
                </div>
              </div>
            </div>
            
            <div style={{ backgroundColor: '#DBEAFE', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem' }}>
                <CreditCard />
                <div>
                  <p style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Ausweisverifizierung</p>
                  <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                    Zur Teilnahme ist eine einmalige Identitätsprüfung per Personalausweis erforderlich.
                  </p>
                </div>
              </div>
            </div>
            
            <div style={{ backgroundColor: '#D1FAE5', padding: '1rem', borderRadius: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem' }}>
                <Bell />
                <div>
                  <p style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Tägliche Benachrichtigungen</p>
                  <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                    Erinnerungen für Ihre Messzeiten:<br/>
                    Morgens: 8-12 Uhr<br/>
                    Abends: 18-22 Uhr
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => setCurrentScreen('registration')}
            style={styles.button}
          >
            Verstanden, weiter zur Registrierung
          </button>
        </div>
      </div>
    </div>
  );

  const renderRegistrationScreen = () => (
    <div style={{ ...styles.minHeight, ...styles.gradient, padding: '1rem' }}>
      <div style={styles.container}>
        <div style={styles.card}>
          <button 
            onClick={() => setCurrentScreen('requirements')}
            style={{ 
              background: 'none', 
              border: 'none', 
              fontSize: '1.5rem', 
              cursor: 'pointer',
              marginBottom: '1rem'
            }}
          >
            ←
          </button>
          
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Registrierung</h2>
          
          {errorMessage && (
            <div style={{ 
              backgroundColor: '#FEE2E2', 
              color: '#DC2626', 
              padding: '0.75rem', 
              borderRadius: '0.5rem', 
              marginBottom: '1rem',
              fontSize: '0.875rem'
            }}>
              {errorMessage}
            </div>
          )}
          
          <div>
            <input
              type="text"
              placeholder="Vollständiger Name (wie auf Ausweis)"
              style={styles.input}
              value={userData.name}
              onChange={(e) => setUserData({...userData, name: e.target.value})}
            />
            <input
              type="email"
              placeholder="E-Mail-Adresse"
              style={styles.input}
              value={userData.email}
              onChange={(e) => setUserData({...userData, email: e.target.value})}
            />
            <input
              type="text"
              placeholder="Krankenkassen-Mitgliedsnummer"
              style={styles.input}
              value={userData.idNumber}
              onChange={(e) => setUserData({...userData, idNumber: e.target.value})}
            />
            
            <div style={{ backgroundColor: '#F3F4F6', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
              <button 
                type="button"
                style={{ 
                  ...styles.button, 
                  background: 'white', 
                  color: '#374151', 
                  border: '1px solid #D1D5DB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <span>Ausweis verifizieren</span>
                <CreditCard />
              </button>
              <p style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.5rem' }}>
                Sie werden zur sicheren Identifikation weitergeleitet
              </p>
            </div>
          </div>
          
          <div style={{ backgroundColor: '#DBEAFE', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
            <h3 style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Teilnahmebedingungen:</h3>
            <ul style={{ fontSize: '0.875rem', color: '#6B7280', paddingLeft: '1.5rem' }}>
              <li>28 Tage (4 Wochen) tägliche Messungen</li>
              <li>2 Videos täglich in den Zeitfenstern</li>
              <li>Messung innerhalb 1 Stunde nach Benachrichtigung</li>
              <li>0,0 Promille bei allen Messungen</li>
              <li>Verpasste/abgelehnte Videos = Neustart</li>
            </ul>
          </div>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'start', gap: '0.5rem' }}>
              <input
                type="checkbox"
                checked={userData.agreed}
                onChange={(e) => setUserData({...userData, agreed: e.target.checked})}
                style={{ marginTop: '0.25rem' }}
              />
              <span style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                Ich akzeptiere die{' '}
                <span
                  onClick={(e) => { e.stopPropagation(); setShowTerms(true); }} 
                  style={{ color: '#3B82F6', textDecoration: 'underline', cursor: 'pointer' }}
                >
                  Teilnahmebedingungen
                </span>{' '}
                und bestätige, dass meine Krankenkasse die Kostenübernahme genehmigt hat.
              </span>
            </label>
          </div>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'start', gap: '0.5rem' }}>
              <input
                type="checkbox"
                checked={userData.notificationsEnabled}
                onChange={(e) => setUserData({...userData, notificationsEnabled: e.target.checked})}
                style={{ marginTop: '0.25rem' }}
              />
              <span style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                Ich erlaube Push-Benachrichtigungen für Messzeiten
              </span>
            </label>
          </div>
          
          <button
            onClick={handleRegistration}
            style={{
              ...styles.button,
              ...(userData.agreed && userData.name && userData.email && userData.idNumber && userData.notificationsEnabled && !isLoading
                ? {}
                : { background: '#D1D5DB', cursor: 'not-allowed' })
            }}
            disabled={!userData.agreed || !userData.name || !userData.email || !userData.idNumber || !userData.notificationsEnabled || isLoading}
          >
            {isLoading ? 'Wird registriert...' : 'Challenge starten'}
          </button>
        </div>
        
        {showTerms && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            zIndex: 50
          }}>
            <div style={{
              ...styles.card,
              maxWidth: '90%',
              maxHeight: '80vh',
              overflowY: 'auto'
            }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Teilnahmebedingungen</h3>
              <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                <p style={{ marginBottom: '0.75rem' }}><strong>1. Programmdauer:</strong> 28 aufeinanderfolgende Tage (4 Wochen)</p>
                <p style={{ marginBottom: '0.75rem' }}><strong>2. Messzeiten:</strong></p>
                <ul style={{ paddingLeft: '1.5rem', marginBottom: '0.75rem' }}>
                  <li>Morgens: 8:00 - 12:00 Uhr</li>
                  <li>Abends: 18:00 - 22:00 Uhr</li>
                  <li>Video innerhalb 60 Minuten nach Benachrichtigung</li>
                </ul>
                <p style={{ marginBottom: '0.75rem' }}><strong>3. Anforderungen:</strong></p>
                <ul style={{ paddingLeft: '1.5rem', marginBottom: '0.75rem' }}>
                  <li>Eigenes, geprüftes Alkoholmessgerät</li>
                  <li>Deutlich sichtbare Messung im Video</li>
                  <li>Ergebnis: 0,0 Promille</li>
                </ul>
                <p style={{ marginBottom: '0.75rem' }}><strong>4. Ablehnung erfolgt bei:</strong></p>
                <ul style={{ paddingLeft: '1.5rem', marginBottom: '0.75rem' }}>
                  <li>Promille über 0,0</li>
                  <li>Undeutlicher Aufnahme</li>
                  <li>Manipulation</li>
                  <li>Verpasster Messung</li>
                </ul>
                <p style={{ marginBottom: '0.75rem' }}><strong>5. Neustart:</strong> Bei Ablehnung oder verpasster Messung startet das Programm von Tag 1</p>
                <p style={{ marginBottom: '0.75rem' }}><strong>6. Datenschutz:</strong> Videos werden nur zur Verifikation verwendet und nach Programmende gelöscht</p>
                <p style={{ marginBottom: '0.75rem' }}><strong>7. Prämie:</strong> Nach erfolgreicher Teilnahme gemäß Vereinbarung mit Ihrer Krankenkasse</p>
              </div>
              <button
                onClick={() => setShowTerms(false)}
                style={{
                  ...styles.button,
                  background: '#1F2937',
                  marginTop: '1.5rem'
                }}
              >
                Schließen
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderDashboard = () => (
    <div style={{ ...styles.minHeight, ...styles.gradient, paddingBottom: '5rem' }}>
      <div style={{ backgroundColor: 'white', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
        <div style={{ ...styles.container, padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Modus-Klar</h1>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>Tag {currentDay} von 28</p>
              <p style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>{userData.name || 'Nutzer'}</p>
              <button
                onClick={handleLogout}
                style={{ 
                  fontSize: '0.75rem', 
                  color: '#DC2626', 
                  background: 'none', 
                  border: 'none',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: 0
                }}
              >
                Abmelden
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div style={styles.container}>
        {(timeWindow.morning || timeWindow.evening) && (
          <div style={{
            backgroundColor: '#FEF3C7',
            border: '1px solid #FCD34D',
            borderRadius: '0.5rem',
            padding: '1rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <Bell />
            <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#92400E' }}>
              Messzeit aktiv! Sie haben noch 60 Minuten
            </p>
          </div>
        )}
        
        <div style={{ ...styles.card, marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>Heutige Messungen</h2>
          
          <div>
            {/* Morgen-Messung */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem',
              backgroundColor: '#F9FAFB',
              borderRadius: '0.5rem',
              marginBottom: '0.75rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Clock />
                <div>
                  <p style={{ fontWeight: '500' }}>Morgen-Messung</p>
                  <p style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>8:00 - 12:00 Uhr</p>
                </div>
              </div>
              {todayVideos.morning === 'verified' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle />
                  <span style={{ fontSize: '0.75rem', color: '#059669' }}>Verifiziert</span>
                </div>
              ) : todayVideos.morning === 'pending' ? (
                <div style={{ fontSize: '0.75rem', color: '#F59E0B' }}>Wird geprüft...</div>
              ) : (
                <button
                  onClick={() => {
                    if (timeWindow.morning) {
                      setCurrentVideoType('morning');
                      setCurrentScreen('recording');
                    }
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    border: 'none',
                    cursor: timeWindow.morning ? 'pointer' : 'not-allowed',
                    backgroundColor: timeWindow.morning ? '#3B82F6' : '#D1D5DB',
                    color: timeWindow.morning ? 'white' : '#9CA3AF'
                  }}
                  disabled={!timeWindow.morning}
                >
                  {timeWindow.morning ? 'Jetzt messen' : 'Zeitfenster geschlossen'}
                </button>
              )}
            </div>
            
            {/* Abend-Messung */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem',
              backgroundColor: '#F9FAFB',
              borderRadius: '0.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Clock />
                <div>
                  <p style={{ fontWeight: '500' }}>Abend-Messung</p>
                  <p style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>18:00 - 22:00 Uhr</p>
                </div>
              </div>
              {todayVideos.evening === 'verified' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle />
                  <span style={{ fontSize: '0.75rem', color: '#059669' }}>Verifiziert</span>
                </div>
              ) : todayVideos.evening === 'pending' ? (
                <div style={{ fontSize: '0.75rem', color: '#F59E0B' }}>Wird geprüft...</div>
              ) : (
                <button
                  onClick={() => {
                    if (timeWindow.evening) {
                      setCurrentVideoType('evening');
                      setCurrentScreen('recording');
                    }
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    border: 'none',
                    cursor: timeWindow.evening ? 'pointer' : 'not-allowed',
                    backgroundColor: timeWindow.evening ? '#9333EA' : '#D1D5DB',
                    color: timeWindow.evening ? 'white' : '#9CA3AF'
                  }}
                  disabled={!timeWindow.evening}
                >
                  {timeWindow.evening ? 'Jetzt messen' : 'Zeitfenster geschlossen'}
                </button>
              )}
            </div>
          </div>
        </div>
        
        <div style={{ ...styles.card, marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
            Fortschritt (Woche {Math.ceil(currentDay / 7)} von 4)
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '0.5rem'
          }}>
            {monthProgress.map((day) => (
              <div
                key={day.day}
                style={{
                  aspectRatio: '1',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  backgroundColor: 
                    day.morning === 'verified' && day.evening === 'verified'
                      ? '#10B981'
                      : day.day === currentDay
                      ? '#3B82F6'
                      : day.day < currentDay
                      ? '#EF4444'
                      : '#E5E7EB',
                  color: 
                    day.morning === 'verified' && day.evening === 'verified'
                      ? 'white'
                      : day.day === currentDay
                      ? 'white'
                      : day.day < currentDay
                      ? 'white'
                      : '#6B7280'
                }}
              >
                {day.day}
              </div>
            ))}
          </div>
          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>
              {Math.round((currentDay / 28) * 100)}% abgeschlossen
            </p>
          </div>
        </div>
        
        <div style={{
          ...styles.card,
          background: 'linear-gradient(to right, #10B981, #059669)',
          color: 'white'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '0.875rem', opacity: 0.9 }}>Ihre Prämie bei Erfolg</p>
              <p style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>Krankenkassen-Bonus</p>
              <p style={{ fontSize: '0.875rem', marginTop: '0.25rem', opacity: 0.9 }}>+ Gesundheitsvorsorge</p>
            </div>
            <div style={{ fontSize: '3rem', opacity: 0.5 }}>
              <Shield />
            </div>
          </div>
        </div>
        
        {userId && (
          <div style={{ 
            marginTop: '1rem', 
            padding: '0.5rem', 
            backgroundColor: 'rgba(255,255,255,0.5)', 
            borderRadius: '0.5rem',
            fontSize: '0.625rem',
            color: '#9CA3AF',
            textAlign: 'center'
          }}>
            ID: {userId}
          </div>
        )}
      </div>
      
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        boxShadow: '0 -10px 15px -3px rgba(0, 0, 0, 0.1)',
        padding: '0.5rem'
      }}>
        <div style={{ ...styles.container, padding: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-around' }}>
            <button style={{ padding: '0.75rem', background: 'none', border: 'none', color: '#3B82F6', fontSize: '1.5rem', cursor: 'pointer' }}>
              <Home />
            </button>
            <button style={{ padding: '0.75rem', background: 'none', border: 'none', color: '#9CA3AF', fontSize: '1.5rem', cursor: 'pointer' }}>
              <Calendar />
            </button>
            <button style={{ padding: '0.75rem', background: 'none', border: 'none', color: '#9CA3AF', fontSize: '1.5rem', cursor: 'pointer' }}>
              <FileText />
            </button>
            <button style={{ padding: '0.75rem', background: 'none', border: 'none', color: '#9CA3AF', fontSize: '1.5rem', cursor: 'pointer' }}>
              <HelpCircle />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderRecordingScreen = () => {
    useEffect(() => {
      startCamera();
      return () => {
        stopCamera();
        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current);
        }
      };
    }, []);
    
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'black', position: 'relative' }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover',
            position: 'absolute',
            top: 0,
            left: 0
          }}
        />
        
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)',
          padding: '1rem',
          zIndex: 10
        }}>
          <div style={styles.container}>
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              borderRadius: '0.5rem',
              padding: '1rem'
            }}>
              <h3 style={{ fontWeight: '600', marginBottom: '0.5rem', fontSize: '1rem' }}>Anleitung für die Messung:</h3>
              <ol style={{ fontSize: '0.875rem', color: '#4B5563', paddingLeft: '1.5rem', margin: 0 }}>
                <li>Halten Sie Ihr Messgerät bereit</li>
                <li>Starten Sie die Aufnahme</li>
                <li>Zeigen Sie das Gerät deutlich (Marke/Modell sichtbar)</li>
                <li>Führen Sie die Messung durch</li>
                <li>Zeigen Sie das Ergebnis (0,0) mindestens 5 Sekunden</li>
                <li>Gesamtdauer: ca. 30 Sekunden</li>
              </ol>
            </div>
          </div>
        </div>
        
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '2rem',
          zIndex: 10
        }}>
          <div style={styles.container}>
            {isRecording && (
              <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  backgroundColor: '#DC2626',
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: '9999px'
                }}>
                  <div style={{
                    width: '0.75rem',
                    height: '0.75rem',
                    backgroundColor: 'white',
                    borderRadius: '50%',
                    animation: 'pulse 1s ease-in-out infinite'
                  }} />
                  <span style={{ fontWeight: '500' }}>{recordingTime}s / 30s</span>
                </div>
              </div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                onClick={isRecording ? stopRecording : startRecording}
                style={{
                  width: '5rem',
                  height: '5rem',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isRecording ? '#DC2626' : 'white',
                  border: 'none',
                  cursor: 'pointer',
                  position: 'relative'
                }}
              >
                {isRecording ? (
                  <Square style={{ fontSize: '2rem', color: 'white' }} />
                ) : (
                  <div style={{
                    width: '4rem',
                    height: '4rem',
                    backgroundColor: '#DC2626',
                    borderRadius: '50%'
                  }} />
                )}
              </button>
            </div>
            
            {!isRecording && (
              <button
                onClick={() => {
                  stopCamera();
                  setCurrentScreen('dashboard');
                }}
                style={{
                  position: 'absolute',
                  top: '-3rem',
                  left: '1rem',
                  color: 'white',
                  background: 'rgba(0,0,0,0.5)',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem'
                }}
              >
                ← Abbrechen
              </button>
            )}
          </div>
        </div>
        
        <style>{`
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
          }
        `}</style>
      </div>
    );
  };

  // Main Render
  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {currentScreen === 'welcome' && renderWelcomeScreen()}
      {currentScreen === 'login' && renderLoginScreen()}
      {currentScreen === 'requirements' && renderRequirementsScreen()}
      {currentScreen === 'registration' && renderRegistrationScreen()}
      {currentScreen === 'dashboard' && renderDashboard()}
      {currentScreen === 'recording' && renderRecordingScreen()}
    </div>
  );
};

export default ModusKlarApp;
