import connectDB from '@/lib/mongodb';
import EventTimer from '@/models/EventTimer';

export const DEFAULT_TIMER_DURATION = 3 * 60 * 60; // 3 hours in seconds (10,800s)

export async function getOrCreateEventTimer() {
  await connectDB();
  let timer = await EventTimer.findOne({ key: 'global_timer' });

  if (!timer) {
    timer = await EventTimer.create({
      key: 'global_timer',
      durationSeconds: DEFAULT_TIMER_DURATION,
      remainingSeconds: DEFAULT_TIMER_DURATION,
      status: 'idle',
      endsAt: null,
      startedAt: null,
    });
  }

  // If timer is marked running, check if it has elapsed
  if (timer.status === 'running') {
    if (!timer.endsAt) {
      // Inconsistent state fallback: pause with remainingSeconds
      timer.status = 'paused';
      await timer.save();
    } else {
      const now = Date.now();
      const ends = new Date(timer.endsAt).getTime();
      const diff = Math.ceil((ends - now) / 1000);

      if (diff <= 0) {
        timer.status = 'expired';
        timer.remainingSeconds = 0;
        timer.endsAt = null;
        await timer.save();
      } else {
        timer.remainingSeconds = diff;
      }
    }
  }

  return timer;
}

export function formatSeconds(seconds) {
  const safe = Math.max(0, Math.floor(seconds || 0));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(h)}H ${pad(m)}M ${pad(s)}S`;
}
