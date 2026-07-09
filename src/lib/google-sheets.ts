// Google Sheets Service for dongbaoOS
// Saves daily health data to Google Sheets automatically

import { google } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

function getAuth() {
  const credentials = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!credentials) return null;
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(credentials),
    scopes: SCOPES,
  });
  return auth;
}

export interface DailySheetRow {
  date: string;
  training: string;
  nutrition: string;
  mind: string;
  sleep: string;
  totalPct: number;
  feeling: number;
  note: string;
  layer: number;
}

export async function appendDailyToSheet(data: DailySheetRow): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = getAuth();
    if (!auth) {
      return { success: false, error: "Google credentials not configured" };
    }

    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    if (!spreadsheetId) {
      return { success: false, error: "GOOGLE_SHEET_ID not configured" };
    }

    const values = [[
      data.date,
      data.training,
      data.nutrition,
      data.mind,
      data.sleep,
      data.totalPct + "%",
      data.feeling || "",
      data.note,
      `Layer ${data.layer}`,
    ]];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Nhật Ký!A:I",
      valueInputOption: "USER_ENTERED",
      requestBody: { values },
    });

    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: msg };
  }
}

export async function appendMetricToSheet(data: {
  date: string;
  name: string;
  value: string;
  unit: string;
  target: string;
  note: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = getAuth();
    if (!auth) {
      return { success: false, error: "Google credentials not configured" };
    }

    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    if (!spreadsheetId) {
      return { success: false, error: "GOOGLE_SHEET_ID not configured" };
    }

    const values = [[
      data.date,
      data.name,
      data.value,
      data.unit,
      data.target,
      data.note,
    ]];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Chỉ Số Sức Khỏe!A:F",
      valueInputOption: "USER_ENTERED",
      requestBody: { values },
    });

    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: msg };
  }
}

// Setup sheet headers if they don't exist
export async function setupSheetHeaders(): Promise<void> {
  const auth = getAuth();
  if (!auth) return;

  const sheets = google.sheets({ version: "v4", auth });
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  if (!spreadsheetId) return;

  // Daily log headers
  try {
    await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Nhật Ký!A1:I1",
    });
  } catch {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: "Nhật Ký!A1:I1",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [["Ngày", "Tập Luyện", "Dinh Dưỡng", "Tư Duy", "Giấc Ngủ", "Hoàn Thành", "Năng Lượng", "Ghi Chú", "Layer"]],
      },
    });
  }
}