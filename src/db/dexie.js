import Dexie from 'dexie';

const db = new Dexie('HealthChallenge30');

db.version(2).stores({
  user:      '++id, phone, startDate',
  taskLogs:  '++id, [dayNumber+taskId], date, taskId, completed',
  syncQueue: '++id, endpoint, method, createdAt',
  dayNotes:  '++id, dayNumber',
});

export default db;
