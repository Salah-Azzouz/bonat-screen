'use client';

import { clsx } from 'clsx';
import type { Branch } from '@/types/branch';

interface BranchListItemProps {
  branch: Branch;
  isSelected: boolean;
  onSelect: (branch: Branch) => void;
}

export function BranchListItem({ branch, isSelected, onSelect }: BranchListItemProps) {
  return (
    <button
      onClick={() => onSelect(branch)}
      className={clsx(
        'flex w-full items-center gap-4 rounded-xl border-2 px-4 py-4 text-start transition-all min-h-[60px]',
        isSelected
          ? 'border-brand-orange bg-brand-orange/5'
          : 'border-transparent bg-surface hover:border-border',
      )}
    >
      {/* Location icon */}
      <div className={clsx(
        'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
        isSelected ? 'bg-brand-orange text-white' : 'bg-bg text-text-muted',
      )}>
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-bold text-text-primary truncate">{branch.district}</p>
        <p className="text-sm text-text-muted">{branch.workingHours}</p>
      </div>

      {isSelected && (
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-orange text-white">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </button>
  );
}
