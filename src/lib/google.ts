/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Production-ready Google Workspace integration client using standard dynamic Google APIs.
// This is powered by the Google Workspace OAuth scopes configured previously.

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  webViewUrl?: string;
}

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { date?: string; dateTime?: string };
  end: { date?: string; dateTime?: string };
}

// Global cached in-memory token retrieval helper
let googleOAuthToken: string | null = null;

export function setGoogleOAuthToken(token: string | null) {
  googleOAuthToken = token;
}

export function getCachedToken(): string | null {
  return googleOAuthToken;
}

export function setCachedToken(token: string | null) {
  setGoogleOAuthToken(token);
}

export function clearCachedToken() {
  setGoogleOAuthToken(null);
}

// ----------------------------------------------------------------------
// GOOGLE DRIVE API INTEGRATIONS
// ----------------------------------------------------------------------
export async function listGoogleDriveFiles(token: string): Promise<GoogleDriveFile[]> {
  try {
    const response = await fetch(
      'https://www.googleapis.com/drive/v3/files?q=trashed%3Dfalse&fields=files(id,name,mimeType,size,webViewUrl)&pageSize=25',
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to list Google Drive files.');
    }

    const data = await response.json();
    return data.files || [];
  } catch (error) {
    console.error('Error listing Google Drive files:', error);
    throw error;
  }
}

export async function uploadFileToGoogleDrive(
  token: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<GoogleDriveFile> {
  try {
    // We can use a simple multipart upload or resumable upload.
    // For general sizing, a metadata + content body multipart upload works perfectly!
    const metadata = {
      name: file.name,
      mimeType: file.type || 'application/octet-stream',
    };

    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const reader = new FileReader();
    const fileDataPromise = new Promise<ArrayBuffer>((resolve, reject) => {
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });

    const bodyBuffer = await fileDataPromise;
    const metadataString = JSON.stringify(metadata);

    const header = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${metadataString}${delimiter}Content-Type: ${file.type || 'application/octet-stream'}\r\n\r\n`;
    const footer = closeDelimiter;

    const encoder = new TextEncoder();
    const part1 = encoder.encode(header);
    const part2 = new Uint8Array(bodyBuffer);
    const part3 = encoder.encode(footer);

    const payload = new Uint8Array(part1.length + part2.length + part3.length);
    payload.set(part1, 0);
    payload.set(part2, part1.length);
    payload.set(part3, part1.length + part2.length);

    if (onProgress) {
      onProgress(30); // Multi-stage artificial progress indicators
    }

    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,webViewUrl',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
          'Content-Length': payload.length.toString(),
        },
        body: payload,
      }
    );

    if (onProgress) {
      onProgress(100);
    }

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to upload file to Google Drive.');
    }

    return await response.json();
  } catch (error) {
    console.error('Error uploading file to Google Drive:', error);
    throw error;
  }
}

export async function deleteFileFromGoogleDrive(token: string, fileId: string): Promise<boolean> {
  try {
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to delete file from Google Drive.');
    }

    return true;
  } catch (error) {
    console.error('Error deleting Google Drive file:', error);
    throw error;
  }
}

// ----------------------------------------------------------------------
// GOOGLE DOCS API INTEGRATIONS
// ----------------------------------------------------------------------
export async function createGoogleDocument(token: string, title: string): Promise<{ documentId: string; title: string }> {
  try {
    // Generate new document on Google Drive
    const response = await fetch('https://docs.googleapis.com/v1/documents', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to create Google Document.');
    }

    const data = await response.json();
    return {
      documentId: data.documentId,
      title: data.title,
    };
  } catch (error) {
    console.error('Error creating Google Document:', error);
    throw error;
  }
}

// ----------------------------------------------------------------------
// GOOGLE CALENDAR API INTEGRATIONS
// ----------------------------------------------------------------------
export async function createGoogleCalendarEvent(
  token: string,
  summary: string,
  description: string,
  date: string, // YYYY-MM-DD
  time?: string // HH:MM
): Promise<GoogleCalendarEvent> {
  try {
    const startDateTime = time ? `${date}T${time}:00` : `${date}T09:00:00`;
    const endDateTime = time ? `${date}T${time}:00` : `${date}T10:00:00`;

    // Construct request body for primary calendar insert
    const body = {
      summary,
      description,
      start: {
        dateTime: new Date(startDateTime).toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: new Date(endDateTime).toISOString(),
        timeZone: 'UTC',
      },
    };

    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to create Google Calendar Event.');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating Google Calendar Event:', error);
    throw error;
  }
}
