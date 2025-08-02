import { supabase } from './supabaseClient';

// Neuen Nutzer registrieren
export async function registerUser(userData) {
  try {
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          email: userData.email,
          name: userData.name,
          insurance_number: userData.idNumber,
          notifications_enabled: userData.notificationsEnabled,
          challenge_start_date: new Date().toISOString().split('T')[0]
        }
      ])
      .select()
      .single();

    if (error) throw error;
    
    // Speichere User ID im Browser
    localStorage.setItem('userId', data.id);
    localStorage.setItem('userName', data.name);
    
    return { success: true, user: data };
  } catch (error) {
    console.error('Registrierung fehlgeschlagen:', error);
    return { success: false, error: error.message };
  }
}

// Video-Metadaten speichern (noch ohne echten Upload)
export async function saveVideoRecord(userId, videoType, dayNumber) {
  try {
    const { data, error } = await supabase
      .from('videos')
      .insert([
        {
          user_id: userId,
          video_type: videoType,
          day_number: dayNumber,
          status: 'pending'
        }
      ])
      .select()
      .single();

    if (error) throw error;
    
    // Update daily progress
    await updateDailyProgress(userId, dayNumber, videoType, 'pending');
    
    return { success: true, video: data };
  } catch (error) {
    console.error('Video-Speicherung fehlgeschlagen:', error);
    return { success: false, error: error.message };
  }
}

// Täglichen Fortschritt updaten
export async function updateDailyProgress(userId, dayNumber, videoType, status) {
  const column = videoType === 'morning' ? 'morning_status' : 'evening_status';
  
  try {
    const { error } = await supabase
      .from('daily_progress')
      .upsert({
        user_id: userId,
        day_number: dayNumber,
        date: new Date().toISOString().split('T')[0],
        [column]: status
      }, {
        onConflict: 'user_id,day_number'
      });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Progress-Update fehlgeschlagen:', error);
    return { success: false, error: error.message };
  }
}

// Nutzer-Fortschritt laden
export async function loadUserProgress(userId) {
  try {
    const { data, error } = await supabase
      .from('daily_progress')
      .select('*')
      .eq('user_id', userId)
      .order('day_number', { ascending: true });

    if (error) throw error;
    return { success: true, progress: data };
  } catch (error) {
    console.error('Progress-Laden fehlgeschlagen:', error);
    return { success: false, error: error.message };
  }
}
