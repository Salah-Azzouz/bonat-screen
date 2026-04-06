import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://stg-api.bonat.io/merchant/v2';
const FIREBASE_BASE = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL || 'https://us-central1-bonatdev.cloudfunctions.net';

export async function POST(request: NextRequest) {
  const { endpoint, body, headers: clientHeaders } = await request.json();

  let targetUrl: string;
  if (endpoint.startsWith('http')) {
    targetUrl = endpoint;
  } else if (endpoint.startsWith('/cf/')) {
    targetUrl = `${FIREBASE_BASE}${endpoint.replace('/cf', '')}`;
  } else {
    targetUrl = `${API_BASE}${endpoint}`;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  if (clientHeaders?.Authorization) {
    headers.Authorization = clientHeaders.Authorization;
  }

  try {
    const res = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body: body,
    });

    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return NextResponse.json(
      { code: -1, errors: ['Server unreachable'] },
      { status: 502 },
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint') || '';
  const authHeader = request.headers.get('authorization') || '';

  let targetUrl: string;
  if (endpoint.startsWith('http')) {
    targetUrl = endpoint;
  } else {
    targetUrl = `${API_BASE}${endpoint}`;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (authHeader) {
    headers.Authorization = authHeader;
  }

  try {
    const res = await fetch(targetUrl, { method: 'GET', headers });
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return NextResponse.json(
      { code: -1, errors: ['Server unreachable'] },
      { status: 502 },
    );
  }
}
