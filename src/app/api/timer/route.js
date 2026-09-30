import { getOrCreateEventTimer, formatSeconds } from '@/lib/eventTimer';

export async function GET() {
  try {
    const timer = await getOrCreateEventTimer();

    return Response.json({
      status: timer.status,
      remainingSeconds: timer.remainingSeconds,
      durationSeconds: timer.durationSeconds,
      endsAt: timer.endsAt ? timer.endsAt.toISOString() : null,
      startedAt: timer.startedAt ? timer.startedAt.toISOString() : null,
      serverTime: new Date().toISOString(),
      formatted: formatSeconds(timer.remainingSeconds),
    });
  } catch (error) {
    console.error('Error fetching event timer:', error);
    return Response.json(
      {
        status: 'idle',
        remainingSeconds: 3 * 3600,
        durationSeconds: 3 * 3600,
        endsAt: null,
        startedAt: null,
        serverTime: new Date().toISOString(),
        formatted: '03H 00M 00S',
      },
      { status: 500 }
    );
  }
}
