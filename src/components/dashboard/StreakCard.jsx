export default function StreakCard({ streak }) {
  const flameColor =
    streak >= 8 ? '#ef4444' : streak >= 4 ? '#f97316' : '#fbbf24';

  const gradient =
    streak >= 8
      ? 'from-red-50 to-orange-50'
      : streak >= 4
      ? 'from-orange-50 to-yellow-50'
      : 'from-yellow-50 to-amber-50';

  return (
    <div className={`bg-gradient-to-br ${gradient} rounded-2xl p-5 border border-white shadow-sm`}>
      <div className="flex items-center gap-4">
        <div
          className={`${streak >= 3 ? 'animate-pulse' : ''} text-[#ea580c]`}
          style={{ display: 'inline-block' }}
        >
          <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <div>
          <p className="font-display font-800 text-3xl text-gray-900">
            {streak} <span className="text-xl font-700">Day{streak !== 1 ? 's' : ''}</span>
          </p>
          <p className="text-sm text-muted font-medium">
            {streak === 0
              ? 'Start your streak today!'
              : streak >= 7
              ? "You're on fire!"
              : "Don't break the chain!"}
          </p>
        </div>
      </div>
    </div>
  );
}
