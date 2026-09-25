// Supabase owns authentication. Demo passwords and sessions are never used here.
let tqSupabase = null, cloudUser = null, cloudVersion = 0;
let cloudReady = false, cloudBusy = false, pendingProgress = null, saveTask = null, sessionGeneration = 0;
function authMessage(message) { document.getElementById('authStatus').textContent = message; }
function syncMessage(message) { document.getElementById('syncStatus').textContent = message; }
function authBusy(busy) {
  cloudBusy = busy;
  for (const id of ['authSubmit', 'registerTab', 'loginTab']) document.getElementById(id).disabled = busy;
}
function showSignedOut() {
  sessionGeneration++;
  cloudUser = null; cloudReady = false; pendingProgress = null; state = null;
  closeProfile(); closeLesson(); openAuth();
  document.getElementById('authPassword').value = '';
  syncMessage('Signed out'); syncDialogVisibility();
}
function progressData(value) {
  const {profile, ...progress} = value;
  return JSON.parse(JSON.stringify(progress));
}
function restoreProgress(progress, user) {
  const profile = {name: user.user_metadata?.display_name || 'Rookie', email: user.email};
  const result = {...freshState(profile), ...progress, profile};
  if (!Array.isArray(result.completed) || !Array.isArray(result.trades) ||
      !Array.isArray(result.earnedBadges) || !result.positions || typeof result.positions !== 'object' ||
      !Number.isFinite(result.cash) || !Number.isFinite(result.xp)) {
    throw new Error('Saved progress could not be read. It has not been overwritten.');
  }
  return result;
}
async function activateSession(session) {
  if (!session) { showSignedOut(); return; }
  if (cloudReady && cloudUser?.id === session.user.id) return;
  const generation = ++sessionGeneration;
  cloudReady = false; pendingProgress = null; state = null; cloudUser = session.user;
  openAuth(); syncDialogVisibility(); authMessage('Loading your saved progress…');
  const {data, error} = await tqSupabase.from('player_progress').select('progress,version').eq('user_id', cloudUser.id).maybeSingle();
  if (generation !== sessionGeneration) return;
  if (error) throw new Error('Could not load progress. Check your connection and that the cloud-progress SQL update has been installed.');
  cloudVersion = data?.version ?? 0;
  state = restoreProgress(data?.progress || {}, session.user);
  cloudReady = true;
  closeAuth(); touchStreak(); syncBadges(); renderAll(); window.showView('dashboard');
  document.getElementById('authPassword').value = '';
  authMessage(''); syncDialogVisibility();
}
async function initCloud() {
  authBusy(true); authMessage('Connecting to your account…');
  try {
    const response = await fetch('/api/config');
    if (!response.ok) throw new Error('Account service is unavailable. Reload to try again.');
    const config = await response.json();
    if (!config.supabaseUrl || !config.supabaseAnonKey) throw new Error('Cloud accounts are not configured yet. Add the Supabase URL and publishable key in Render.');
    if (!window.supabase?.createClient) throw new Error('Account library could not load. Check your connection and reload.');
    tqSupabase = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
    const {data, error} = await tqSupabase.auth.getSession();
    if (error) throw error;
    await activateSession(data.session);
    if (!data.session) authMessage('Create a cloud account, or log in. Earlier demo accounts are separate.');
    tqSupabase.auth.onAuthStateChange((event, session) => {
      // Never await a Supabase call inside its auth callback.
      if (event === 'SIGNED_OUT') showSignedOut();
      if (event === 'SIGNED_IN' && !cloudBusy && (!cloudReady || cloudUser?.id !== session?.user.id)) {
        setTimeout(() => activateSession(session).catch(error => authMessage(error.message)), 0);
      }
    });
  } catch (error) {
    authMessage(error.message || 'Unable to connect. Reload to try again.');
    syncMessage('Account connection unavailable');
  }
  finally { authBusy(false); document.getElementById('authSubmit').disabled = !tqSupabase; }
}
async function submitCloudAuth(event) {
  event.preventDefault();
  if (cloudBusy || !tqSupabase) return;
  const email = document.getElementById('authEmail').value.trim();
  const password = document.getElementById('authPassword').value;
  const name = document.getElementById('authName').value.trim() || 'Rookie';
  const registering = authMode === 'register';
  authBusy(true); authMessage(registering ? 'Creating your account…' : 'Logging in…');
  try {
    const result = registering
      ? await tqSupabase.auth.signUp({email, password, options: {data: {display_name: name}, emailRedirectTo: location.origin + '/'}})
      : await tqSupabase.auth.signInWithPassword({email, password});
    if (result.error) throw result.error;
    document.getElementById('authPassword').value = '';
    if (!result.data.session) {
      setAuthMode('login');
      authMessage('Check your email for a confirmation link, then return here to log in. If you already have an account, use Log In.');
      return;
    }
    await activateSession(result.data.session);
  } catch (error) { authMessage(error.message || 'Unable to sign in. Please try again.'); }
  finally { authBusy(false); syncDialogVisibility(); }
}
function queueCloudSave() {
  if (!cloudReady || !cloudUser || !state) return;
  pendingProgress = progressData(state);
  syncMessage('Saving progress…'); flushCloudSave();
}
function flushCloudSave() {
  if (saveTask) return saveTask;
  if (!pendingProgress || !cloudReady || !cloudUser) return Promise.resolve();
  const userId = cloudUser.id, generation = sessionGeneration;
  saveTask = (async () => {
    while (pendingProgress && generation === sessionGeneration) {
      const snapshot = pendingProgress;
      pendingProgress = null;
      try {
        const row = {user_id: userId, progress: snapshot, version: cloudVersion + 1};
        const query = cloudVersion === 0
          ? tqSupabase.from('player_progress').insert(row)
          : tqSupabase.from('player_progress').update({progress: snapshot, version: cloudVersion + 1}).eq('user_id', userId).eq('version', cloudVersion);
        const {data, error} = await query.select('version').maybeSingle();
        if (generation !== sessionGeneration) return;
        if (error || !data) {
          if (!error || error.code === '23505') {
            cloudReady = false; pendingProgress = null;
            openAuth(); syncDialogVisibility();
            authMessage('Progress changed in another tab or device. Reload this page before continuing.');
            syncMessage('Reload to load the latest progress'); return;
          }
          throw error;
        }
        cloudVersion = data.version;
      } catch {
        if (generation !== sessionGeneration) return;
        pendingProgress ||= snapshot;
        syncMessage('Progress not saved. Keep this page open and use Retry save.'); return;
      }
    }
    if (generation === sessionGeneration) syncMessage('Progress saved to your account');
  })().finally(() => {
    saveTask = null;
    // A different account may have loaded while the previous request finished.
    if (generation !== sessionGeneration && pendingProgress && cloudReady) flushCloudSave();
  });
  return saveTask;
}
async function cloudLogout() {
  if (cloudBusy || !tqSupabase) return;
  authBusy(true);
  try {
    await flushCloudSave();
    if (pendingProgress) { toast('Progress is not saved yet. Retry save before logging out.'); return; }
    const {error} = await tqSupabase.auth.signOut({scope: 'local'});
    if (error) throw error;
    showSignedOut(); authMessage('You are logged out.');
  } catch (error) { toast(error.message || 'Unable to log out. Please try again.'); }
  finally { authBusy(false); }
}
window.addEventListener('beforeunload', event => {
  if (pendingProgress || saveTask) { event.preventDefault(); event.returnValue = ''; }
});
window.addEventListener('online', () => flushCloudSave());
document.addEventListener('DOMContentLoaded', initCloud);
