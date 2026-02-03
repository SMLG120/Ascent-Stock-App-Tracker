"use client";
import { useDebounce } from "@/hooks/useDebounce";
import { addToWatchlist, removeFromWatchlist } from "@/lib/actions/watchlist.actions";
import { Star, Trash2, StarIcon, Stars } from "lucide-react";
import React, { useCallback, useMemo, useState } from "react";
import { toast } from 'sonner';
// Minimal WatchlistButton implementation to satisfy page requirements.
// This component focuses on UI contract only. It toggles local state and
// calls onWatchlistChange if provided. Styling hooks match globals.css.

export const WatchlistButton = ({
  symbol,
  company,
  isInWatchlist,
  showTrashIcon = false,
  type = "button",
  onWatchlistChange,
}: WatchlistButtonProps) => {
  const [added, setAdded] = useState<boolean>(!!isInWatchlist);
  const [isPending, setIsPending] = useState(false);

  const label = useMemo(() => {
    if (type === "icon") return added ? "" : "";
    return added ? "Remove from Watchlist" : "Add to Watchlist";
  }, [added, type]);

  // Handle adding/removing stocks from watchlist
  const toggleWatchlist = useCallback(async () => {
    const wasAdded = added;
    setIsPending(true);
    try {
      const result = wasAdded
        ? await removeFromWatchlist(symbol)
        : await addToWatchlist(symbol, company);

      if (result.success) {
        toast.success(wasAdded ? 'Removed from Watchlist' : 'Added to Watchlist', {
          description: `${company} ${wasAdded ? 'removed from' : 'added to'} your watchlist`,
        });
        onWatchlistChange?.(symbol, !wasAdded);
      } else {
        // Revert optimistic update on failure
        setAdded(wasAdded);
        toast.error('Action failed', { description: result.message || 'Please try again' });
      }
    } catch (error) {
      // Revert optimistic update on error
      setAdded(wasAdded);
      toast.error('Something went wrong', { description: 'Please try again' });
    } finally {
      setIsPending(false);
    }
  }, [added, symbol, company, onWatchlistChange]);
  // Debounce the toggle function to prevent rapid API calls (300ms delay)
  const debouncedToggle = useDebounce(toggleWatchlist, 300);

  const handleClick = (e: React.MouseEvent) => {
    // Prevent event bubbling and default behavior
    e.stopPropagation();
    e.preventDefault();

    if (isPending) return;
    setAdded(!added);
    debouncedToggle();
  }

  if (type === 'icon') {
    return (
      <button
        title={
          added
            ? `Remove ${symbol} from watchlist`
            : `Add ${symbol} to watchlist`
        }
        aria-label={
          added
            ? `Remove ${symbol} from watchlist`
            : `Add ${symbol} to watchlist`
        }
        className={`watchlist-icon-btn ${added ? 'watchlist-icon-added' : ''}`}
        onClick={handleClick}
      >
        <Star fill={added ? 'currentColor' : 'none'} />
      </button>
    );
  }

  return (
    <button
      className={`watchlist-btn ${added ? 'watchlist-remove' : ''}`}
      onClick={handleClick}
    >
      {showTrashIcon && added ? <Trash2 /> : null}
      <span>{label}</span>
    </button>
  );
};