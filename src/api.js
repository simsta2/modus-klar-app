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
// Admin Login Check
export async function checkAdminAccess(email) {
  try {
    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .eq('email', email.toLowerCase()) // <-- toLowerCase() hinzufügen
      .single();

    if (error) throw error;
    return { success: true, isAdmin: true };
  } catch (error) {
    return { success: false, isAdmin: false };
  }
}

// Alle Nutzer laden
export async function getAllUsers() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, users: data };
  } catch (error) {
    console.error('Fehler beim Laden der Nutzer:', error);
    return { success: false, error: error.message };
  }
}

// Alle Videos laden
export async function getAllVideos() {
  try {
    const { data, error } = await supabase
      .from('videos')
      .select(`
        *,
        users (
          name,
          email
        )
      `)
      .order('recorded_at', { ascending: false });

    if (error) throw error;
    return { success: true, videos: data };
  } catch (error) {
    console.error('Fehler beim Laden der Videos:', error);
    return { success: false, error: error.message };
  }
}

// Video-Status aktualisieren
export async function updateVideoStatus(videoId, status, rejectionReason = null) {
  try {
    const updateData = {
      status: status,
      verified_at: new Date().toISOString(),
      verified_by: localStorage.getItem('adminEmail')
    };
    
    if (rejectionReason) {
      updateData.rejection_reason = rejectionReason;
    }

    const { data, error } = await supabase
      .from('videos')
      .update(updateData)
      .eq('id', videoId)
      .select()
      .single();

    if (error) throw error;
    
    // Update daily progress
    await supabase
      .from('daily_progress')
      .update({
        [`${data.video_type}_status`]: status
      })
      .eq('user_id', data.user_id)
      .eq('day_number', data.day_number);

    return { success: true, video: data };
  } catch (error) {
    console.error('Fehler beim Update:', error);
    return { success: false, error: error.message };
  }
}

// Nutzer-Statistiken
export async function getUserStats(userId) {
  try {
    const { data, error } = await supabase
      .from('daily_progress')
      .select('*')
      .eq('user_id', userId)
      .order('day_number', { ascending: true });

    if (error) throw error;
    
    const completedDays = data.filter(
      d => d.morning_status === 'verified' && d.evening_status === 'verified'
    ).length;
    
    return { 
      success: true, 
      stats: {
        totalDays: data.length,
        completedDays: completedDays,
        successRate: (completedDays / data.length * 100).toFixed(1)
      }
    };
  } catch (error) {
    console.error('Fehler beim Laden der Statistiken:', error);
    return { success: false, error: error.message };
  }
}

export async function uploadVideo(videoBlob, userId, videoType, dayNumber) {
  try {
    // Erstelle eindeutigen Dateinamen
    const fileName = `${userId}_${dayNumber}_${videoType}_${Date.now()}.webm`;
    
    console.log('Starte Upload:', fileName, 'Größe:', videoBlob.size);
    
    // Upload zu Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('videofiles')  // <-- NEUER BUCKET NAME
      .upload(fileName, videoBlob);

    if (uploadError) {
      console.error('Storage Upload Error:', uploadError);
      throw uploadError;
    }

    // Hole die öffentliche URL
    const { data } = supabase.storage
      .from('videofiles')  // <-- NEUER BUCKET NAME
      .getPublicUrl(fileName);

    console.log('Public URL:', data.publicUrl);

    // Speichere Video-Eintrag in Datenbank
    const { data: dbData, error: dbError } = await supabase
      .from('videos')
      .insert([
        {
          user_id: userId,
          video_type: videoType,
          day_number: dayNumber,
          status: 'pending',
          video_url: data.publicUrl,
          file_size: videoBlob.size
        }
      ])
      .select()
      .single();

    if (dbError) {
      console.error('Database Error:', dbError);
      throw dbError;
    }
    
    console.log('Video erfolgreich gespeichert:', dbData);
    return { success: true, video: dbData };
    
  } catch (error) {
    console.error('Upload komplett fehlgeschlagen:', error);
    return { success: false, error: error.message };
  }
}

// Nutzer Login
export async function loginUser(email) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) throw error;
    
    // Speichere User ID im Browser
    localStorage.setItem('userId', data.id);
    localStorage.setItem('userName', data.name);
    
    return { success: true, user: data };
  } catch (error) {
    console.error('Login fehlgeschlagen:', error);
    return { success: false, error: 'Email nicht gefunden oder falsches Passwort' };
  }
}
