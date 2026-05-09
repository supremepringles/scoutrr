const CONDITION_MAP = [
  { match: (value) => value.startsWith('new'), className: 'condition-badge new', label: 'New' },
  { match: (value) => value.includes('open box'), className: 'condition-badge open-box', label: 'Open Box' },
  { match: (value) => value.includes('refurbished'), className: 'condition-badge refurbished', label: 'Refurbished' },
  { match: (value) => value.includes('used'), className: 'condition-badge used', label: 'Used' },
];

export default function ConditionBadge({ condition }) {
  const value = String(condition || 'Unknown').toLowerCase();
  const match = CONDITION_MAP.find((entry) => entry.match(value));

  if (match) {
    return <span className={match.className}>{match.label}</span>;
  }

  return <span className="condition-badge used">{condition || 'Unknown'}</span>;
}
