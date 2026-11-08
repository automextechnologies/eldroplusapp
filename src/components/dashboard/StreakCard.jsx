export default function StreakCard({ streak }) {
  return (
    <div className="bg-white rounded-[22px] p-5 border border-black/[0.06] shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
      <div className="flex items-center gap-4">
        <div
          className={`w-12 h-12 rounded-2xl bg-[#FF9500]/10 flex items-center justify-center text-[#FF9500] ${streak >= 3 ? 'animate-pulse' : ''}`}
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12.87 2.13a.75.75 0 00-1.14-.07C9.33 4.19 6 8.54 6 12.5a6 6 0 0012 0c0-1.74-.63-3.41-1.76-4.72-.34-.4-.9-.55-1.4-.37-.5.18-.84.66-.84 1.19 0 .88-.35 1.73-.97 2.35a.75.75 0 01-1.28-.53c0-2.48.72-5.45 2.12-8.29z" />
          </svg>
        </div>
        <div>
          <p className="font-display font-bold text-3xl text-[#1D1D1F] tracking-tight">
            {streak} <span className="text-lg font-normal text-[#86868B]">Day{streak !== 1 ? 's' : ''}</span>
          </p>
          <p className="text-xs text-[#86868B] font-medium mt-0.5">
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
