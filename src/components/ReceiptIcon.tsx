import React from 'react';

interface ReceiptIconProps {
  size?: number;
  strokeWidth?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Komnottra Signature Receipt Icon
 * Modern, clean thermal slip with smooth rounded top, authentic bottom tear,
 * and elegant expense ledger lines (without clutter or currency bias).
 */
export function ReceiptIcon({
  size = 22,
  strokeWidth = 2.2,
  color = 'currentColor',
  className,
  style,
}: ReceiptIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}
    >
      {/* Clean receipt silhouette with smooth rounded top corners and crisp 3-point tear at bottom */}
      <path d="M5 3.5A1.5 1.5 0 0 1 6.5 2h11A1.5 1.5 0 0 1 19 3.5V20.5l-2.5-1.5-2.5 1.5-2-1.5-2 1.5-2.5-1.5L5 20.5V3.5z" />
      {/* Header/Merchant bar */}
      <line x1="8.5" y1="6.5" x2="15.5" y2="6.5" />
      {/* Line item 1 */}
      <line x1="8.5" y1="10.5" x2="15.5" y2="10.5" />
      {/* Total amount bar with trailing point */}
      <line x1="8.5" y1="14.5" x2="12.5" y2="14.5" />
      <circle cx="15.5" cy="14.5" r="0.75" fill={color} stroke="none" />
    </svg>
  );
}

export default ReceiptIcon;
