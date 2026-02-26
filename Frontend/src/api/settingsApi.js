/**
 * api/settingsApi.js
 * Frontend service layer for interacting with the backend settings endpoints.
 */

// ── Shared Fetch Wrapper ──────────────────────────────────────────────────────

async function fetchSettingsApi(endpoint, options = {}) {
    const res = await fetch(endpoint, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.error || data.message || 'An error occurred while saving settings.');
    }

    return data.data;
}

// ── Profile API ───────────────────────────────────────────────────────────────

export async function getProfile() {
    return fetchSettingsApi('/api/settings/profile');
}

export async function updateProfile(profileData) {
    return fetchSettingsApi('/api/settings/profile', {
        method: 'PATCH',
        body: JSON.stringify(profileData),
    });
}

// ── Preferences API ───────────────────────────────────────────────────────────

export async function getPreferences() {
    return fetchSettingsApi('/api/settings/preferences');
}

export async function updatePreferences(preferencesData) {
    return fetchSettingsApi('/api/settings/preferences', {
        method: 'PATCH',
        body: JSON.stringify(preferencesData),
    });
}

// ── Helper ────────────────────────────────────────────────────────────────────

/**
 * Fetches both profile and preferences concurrently.
 * Returns { profile, preferences }.
 */
export async function getAllSettings() {
    const [profile, preferences] = await Promise.all([
        getProfile(),
        getPreferences(),
    ]);
    return { profile, preferences };
}
