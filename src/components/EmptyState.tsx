'use client';

import { Button } from './ui/Button';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 animate-fade-in">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-orange/10">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-text-primary">{title}</h3>
      <p className="max-w-xs text-center text-sm text-text-secondary">{description}</p>
      {action && (
        <Button variant="outline" size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
