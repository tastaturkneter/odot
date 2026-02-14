const CX = 8;
const CY = 8;
const OUTER_R = 6.5;
const INNER_R = 4.5;

function piePath(progress: number): string {
  if (progress <= 0) return "";
  if (progress >= 1) return `M ${CX},${CY} m -${INNER_R},0 a ${INNER_R},${INNER_R} 0 1,1 ${INNER_R * 2},0 a ${INNER_R},${INNER_R} 0 1,1 -${INNER_R * 2},0 Z`;

  const angle = progress * 2 * Math.PI;
  const startX = CX;
  const startY = CY - INNER_R;
  const endX = CX + INNER_R * Math.sin(angle);
  const endY = CY - INNER_R * Math.cos(angle);
  const largeArc = angle > Math.PI ? 1 : 0;

  return `M ${CX},${CY} L ${startX},${startY} A ${INNER_R},${INNER_R} 0 ${largeArc},1 ${endX},${endY} Z`;
}

interface ProgressCircleProps {
  progress: number;
  color?: string;
  className?: string;
}

export function ProgressCircle({ progress, color, className = "h-4 w-4" }: ProgressCircleProps) {
  const c = color ?? "#6366f1";
  return (
    <svg className={`shrink-0 ${className}`} viewBox="0 0 16 16">
      <circle
        cx={CX}
        cy={CY}
        r={OUTER_R}
        fill="none"
        stroke={c}
        strokeWidth="1.2"
      />
      {progress > 0 && (
        <path
          d={piePath(progress)}
          fill={c}
        />
      )}
    </svg>
  );
}
