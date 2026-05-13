/**
 * Compute a tool's displayed status from its underlying state.
 *
 * Priority (first match wins):
 *   1. stored status is AT_EVENT *and* one of its current assignments points
 *      to an event that is happening right now → AT_EVENT.
 *      (Takes precedence over a borrower so a tool that was borrowed before
 *      being sent to the event still shows AT_EVENT while it's there.)
 *
 *   2. borrowedById set → BORROWED.
 *      (Hit after rule 1, so when the event ends the tool naturally reverts
 *      to the person who had it before, not to IN_STORAGE.)
 *
 *   3. stored status is AT_EVENT but no event is running and no borrower is
 *      set → IN_STORAGE (the event ended, nobody's holding it).
 *
 *   4. anything else (IN_STORAGE / MAINTENANCE / LOST) → keep stored value.
 *
 * Why this exists: AT_EVENT can drift (event ended but the row never got
 * updated). Deriving at read time means the UI always shows the truth without
 * needing a scheduled cleanup job.
 *
 * Expected `tool` shape:
 *   { status, borrowedById, eventUsages: [{ event: { startDate, endDate } }] }
 *   eventUsages should be filtered to active ones (returnedAt: null).
 */
function deriveToolStatus(tool, now = new Date()) {
  if (tool.status === 'AT_EVENT') {
    const hasRunningEvent = (tool.eventUsages ?? []).some((eu) => {
      const start = new Date(eu.event.startDate);
      const end = new Date(eu.event.endDate);
      return start <= now && now <= end;
    });
    if (hasRunningEvent) return 'AT_EVENT';
  }

  if (tool.borrowedById !== null && tool.borrowedById !== undefined) {
    return 'BORROWED';
  }

  if (tool.status === 'AT_EVENT') {
    return 'IN_STORAGE';
  }

  return tool.status;
}

module.exports = { deriveToolStatus };
