"use client";

interface TopicStat {
  topic: string;
  correct: number;
  total: number;
}

export default function WeakAreasSummary({ stats }: { stats: TopicStat[] }) {
  const sorted = [...stats].sort(
    (a, b) => a.correct / a.total - b.correct / b.total
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <h2 className="text-base font-semibold text-gray-900 mb-4">
        Performance by Topic
      </h2>
      <div className="space-y-4">
        {sorted.map(({ topic, correct, total }) => {
          const pct = Math.round((correct / total) * 100);
          const weak = pct < 70;
          return (
            <div key={topic}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-700">{topic}</span>
                <span
                  className={`text-sm font-semibold ${
                    weak ? "text-red-500" : "text-green-600"
                  }`}
                >
                  {correct}/{total} ({pct}%)
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    weak ? "bg-red-400" : "bg-green-500"
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              {weak && (
                <p className="text-xs text-red-500 mt-1">
                  Needs revision — review {topic.toLowerCase()}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
