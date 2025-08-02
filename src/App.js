import React, { useState, useRef, useEffect } from 'react';
import { registerUser, saveVideoRecord, loadUserProgress } from './api';

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
  const [recordedBlob, setRecordedBlob] = useState(null);
  
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const recordingIntervalRef = useRef(null);

  // Beim Start: Check ob User bereits eingeloggt
  useEffect(() => {
    const savedUserId = localStorage.getItem('userId');
    const savedUserName = localStorage.getItem('userName');
    
    if (savedUserId && savedUserName) {
      setUserId(savedUserId);
      setUserData(prev => ({ ...prev, name: savedUserName }));
      setCurrentScreen('dashboard');
      
      // Lade Fortschritt
      loadProgress(savedUserId);
    }
  }, []);

  // Lade Nutzer-Fortschritt aus Datenbank
  const loadProgress = async (userId) => {
    const result = await loadUserProgress(userId);
    if (result.success && result.progress) {
      // Berechne aktuellen Tag basierend auf Fortschritt
      const completedDays = result.progress.filter(
        p => p.morning_status === 'verified' && p.evening_status === 'verified'
      ).length;
      setCurrentDay(completedDays + 1);
      
      // Setze heutigen Status
      const today = result.progress.find(p => p.day_number === completedDays + 1);
      if (today) {
        setTodayVideos({
          morning: today.morning_status,
          evening: today.evening_status
        });
      }
    }
  };

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
      marginBottom: '1rem'
    }
  };

  // Simuliere Zeitfenster-Check
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
    const interval = setInterval(checkTimeWindows, 60000);
    return () => clearInterval(interval);
  }, []);

  // Simuliere Fortschritt
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

  // Registrierung mit echter Datenbank
  const handleRegistration = async () => {
    setIsLoading(true);
    setErrorMessage('');
    
    const result = await registerUser(userData);
    
    if (result.success) {
      setUserId(result.user.id);
      setCurrentScreen('dashboard');
    } else {
      setErrorMessage('Registrierung fehlgeschlagen: ' + result.error);
    }
    
    setIsLoading(false);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' }, 
        audio: true 
      });
      videoRef.current.srcObject = stream;
      streamRef.current = stream;
    } catch (err) {
      console.error('Kamera-Zugriff verweigert:', err);
      alert('Bitte erlauben Sie den Kamera-Zugriff für diese App.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const startRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
    
    const chunks = [];
    const options = { mimeType: 'video/webm' };
    mediaRecorderRef.current = new MediaRecorder(streamRef.current, options);
    
    mediaRecorderRef.current.ondataavailable = (e) => {
      chunks.push(e.data);
    };
    
    mediaRecorderRef.current.onstop = async () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      setRecordedBlob(blob);
      
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
    
    recordingIntervalRef.current = setInterval(() => {
      setRecordingTime(prev => {
        if (prev >= 30) {
          stopRecording();
          return 30;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }
    stopCamera();
    setCurrentScreen('dashboard');
  };

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
            Jetzt starten
          </button>
          
          {localStorage.getItem('userId') && (
            <button
              onClick={() => {
                setUserId(localStorage.getItem('userId'));
                setUserData(prev => ({ ...prev, name: localStorage.getItem('userName') }));
                setCurrentScreen('dashboard');
              }}
              style={{ 
                ...styles.button, 
                marginTop: '1rem',
                background: '#6B7280'
              }}
            >
              Als {localStorage.getItem('userName')} fortfahren
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const renderRequirementsScreen = () => (
    <div style={{ ...styles.minHeight, ...styles.gradient, padding: '1rem' }}>
      <div style={styles.container}>
        <div style={styles.card}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Voraussetzungen</h2>
          
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ backgroundColor: '#FEF3C7', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem' }}>
                <AlertCircle />
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
        
        <div style={{ 
          marginTop: '1rem', 
          padding: '1rem', 
          backgroundColor: 'rgba(255,255,255,0.8)', 
          borderRadius: '0.5rem',
          fontSize: '0.75rem',
          color: '#6B7280',
          textAlign: 'center'
        }}>
          User ID: {userId}
        </div>
      </div>
      
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        boxShadow: '0 -10px 15px -3px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ ...styles.container, padding: '0.5rem' }}>
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
      return () => stopCamera();
    }, []);
    
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'black', position: 'relative' }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(to bottom, black, transparent)',
          padding: '1rem'
        }}>
          <div style={styles.container}>
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              borderRadius: '0.5rem',
              padding: '1rem'
            }}>
              <h3 style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Anleitung für die Messung:</h3>
              <ol style={{ fontSize: '0.875rem', color: '#4B5563', paddingLeft: '1.5rem' }}>
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
          padding: '2rem'
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
                  cursor: 'pointer'
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
                  top: '2rem',
                  left: '1rem',
                  color: 'white',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                Abbrechen
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

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {currentScreen === 'welcome' && renderWelcomeScreen()}
      {currentScreen === 'requirements' && renderRequirementsScreen()}
      {currentScreen === 'registration' && renderRegistrationScreen()}
      {currentScreen === 'dashboard' && renderDashboard()}
      {currentScreen === 'recording' && renderRecordingScreen()}
    </div>
  );
};

export default ModusKlarApp;
