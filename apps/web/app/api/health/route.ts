import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json({
    service: 'web',
    status: 'ok',
    uptimeSeconds: Math.round(process.uptime()),
    version: '0.0.1',
  });
}
