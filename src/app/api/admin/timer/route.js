import { requireAdmin } from '@/lib/requireAuth';
import { getOrCreateEventTimer, formatSeconds, DEFAULT_TIMER_DURATION } from '@/lib/eventTimer';

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });

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
}

export async function POST(request) {
  const auth = await requireAdmin();
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });

  const body = await request.json();
  const { action, durationSeconds, addSeconds } = body || {};

  const timer = await getOrCreateEventTimer();
  const now = Date.now();

  if (action === 'start' || action === 'on') {
    // If timer is idle or expired, start a fresh countdown (default 3 hours)
    if (timer.status === 'idle' || timer.status === 'expired') {
      const duration = Number(durationSeconds) > 0 ? Number(durationSeconds) : DEFAULT_TIMER_DURATION;
      timer.durationSeconds = duration;
      timer.remainingSeconds = duration;
      timer.endsAt = new Date(now + duration * 1000);
      timer.startedAt = new Date(now);
      timer.status = 'running';
    } else if (timer.status === 'paused') {
      // Resume from paused remaining seconds
      const remaining = timer.remainingSeconds > 0 ? timer.remainingSeconds : DEFAULT_TIMER_DURATION;
      timer.remainingSeconds = remaining;
      timer.endsAt = new Date(now + remaining * 1000);
      timer.status = 'running';
    }
  } else if (action === 'pause') {
    if (timer.status === 'running' && timer.endsAt) {
      const diff = Math.max(0, Math.ceil((new Date(timer.endsAt).getTime() - now) / 1000));
      timer.remainingSeconds = diff;
      timer.endsAt = null;
      timer.status = diff <= 0 ? 'expired' : 'paused';
    }
  } else if (action === 'resume') {
    if (timer.status === 'paused') {
      const remaining = timer.remainingSeconds > 0 ? timer.remainingSeconds : DEFAULT_TIMER_DURATION;
      timer.remainingSeconds = remaining;
      timer.endsAt = new Date(now + remaining * 1000);
      timer.status = 'running';
    } else if (timer.status === 'idle') {
      const duration = Number(durationSeconds) > 0 ? Number(durationSeconds) : DEFAULT_TIMER_DURATION;
      timer.durationSeconds = duration;
      timer.remainingSeconds = duration;
      timer.endsAt = new Date(now + duration * 1000);
      timer.startedAt = new Date(now);
      timer.status = 'running';
    }
  } else if (action === 'reset') {
    const duration = Number(durationSeconds) > 0 ? Number(durationSeconds) : DEFAULT_TIMER_DURATION;
    timer.durationSeconds = duration;
    timer.remainingSeconds = duration;
    timer.status = 'idle';
    timer.endsAt = null;
    timer.startedAt = null;
  } else if (action === 'adjust' && typeof addSeconds === 'number') {
    const delta = Math.floor(addSeconds);
    if (timer.status === 'running' && timer.endsAt) {
      const currentRemaining = Math.max(0, Math.ceil((new Date(timer.endsAt).getTime() - now) / 1000));
      const newRemaining = Math.max(0, currentRemaining + delta);
      if (newRemaining <= 0) {
        timer.status = 'expired';
        timer.remainingSeconds = 0;
        timer.endsAt = null;
      } else {
        timer.remainingSeconds = newRemaining;
        timer.endsAt = new Date(now + newRemaining * 1000);
      }
    } else {
      timer.remainingSeconds = Math.max(0, timer.remainingSeconds + delta);
    }
  } else {
    return Response.json({ error: `Unknown timer action: ${action}` }, { status: 400 });
  }

  await timer.save();

  return Response.json({
    success: true,
    action,
    timer: {
      status: timer.status,
      remainingSeconds: timer.remainingSeconds,
      durationSeconds: timer.durationSeconds,
      endsAt: timer.endsAt ? timer.endsAt.toISOString() : null,
      startedAt: timer.startedAt ? timer.startedAt.toISOString() : null,
      serverTime: new Date().toISOString(),
      formatted: formatSeconds(timer.remainingSeconds),
    },
  });
}
