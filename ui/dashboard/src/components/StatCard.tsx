import { useTheme } from "../context/ThemeContext";

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  icon: React.ReactNode;
}

export function StatCard({ title, value, change, icon }: StatCardProps) {
  const { isDark } = useTheme();

  return (
    <div
      className="rounded-xl p-5 transition-all duration-200"
      style={{
        backgroundColor: isDark ? '#161B22' : '#FFFFFF',
        border: `1px solid ${isDark ? '#21262D' : '#D8DEE4'}`,
        boxShadow: isDark
          ? '0 1px 3px rgba(0,0,0,0.3)'
          : '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = isDark ? '#1F6FEB' : '#0969DA';
        e.currentTarget.style.boxShadow = isDark
          ? '0 4px 12px rgba(31,111,235,0.15)'
          : '0 4px 12px rgba(9,105,218,0.1)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = isDark ? '#21262D' : '#D8DEE4';
        e.currentTarget.style.boxShadow = isDark
          ? '0 1px 3px rgba(0,0,0,0.3)'
          : '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)';
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="p-2 rounded-lg"
          style={{
            color: isDark ? '#58A6FF' : '#0969DA',
            backgroundColor: isDark ? 'rgba(31,111,235,0.1)' : 'rgba(9,105,218,0.08)',
          }}
        >
          {icon}
        </div>
        {change && (
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={change.startsWith('+')
              ? {
                color: isDark ? '#3FB950' : '#1A7F37',
                backgroundColor: isDark ? 'rgba(63,185,80,0.1)' : 'rgba(26,127,55,0.08)',
              }
              : {
                color: isDark ? '#F85149' : '#CF222E',
                backgroundColor: isDark ? 'rgba(248,81,73,0.1)' : 'rgba(207,34,46,0.06)',
              }
            }
          >
            {change}
          </span>
        )}
      </div>
      <div
        className="text-sm mb-0.5"
        style={{ color: isDark ? '#8B949E' : '#57606A' }}
      >
        {title}
      </div>
      <div
        className="text-xl font-semibold"
        style={{ color: isDark ? '#E6EDF3' : '#1F2328' }}
      >
        {value}
      </div>
    </div>
  );
}
