import React from 'react';

interface Props {
  confidence: number;
  size?: 'sm' | 'md';
}

export function ConfidenceBadge({ confidence, size = 'md' }: Props) {
  const pct = Math.round(confidence * 100);

  let colorClass = '';
  let indicator = '';
  if (confidence >= 0.9) {
    colorClass = 'bg-green-100 text-green-800';
    indicator = '✓';
  } else if (confidence >= 0.7) {
    colorClass = 'bg-amber-100 text-amber-800';
    indicator = '~';
  } else {
    colorClass = 'bg-red-100 text-red-800';
    indicator = '!';
  }

  const sizeClass = size === 'sm' ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-0.5 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full font-medium ${colorClass} ${sizeClass}`}
    >
      <span>{indicator}</span>
      <span>{pct}%</span>
    </span>
  );
}
