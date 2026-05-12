/**
 * Compute a tool's displayed status from its underlying state.
 *
 * Priority (first match wins):
 *   1. borrowedById set     → BORROWED
 *   2. stored status is AT_EVENT:
 *        - any active assignment whose event is currently happening → AT_EVENT
 *        - otherwise (event already ended, no current event)          → IN_STORAGE
 *   3. anything else (IN_STORAGE / MAINTENANCE / LOST)
 *      → keep the stored value
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
  if (tool.borrowedById !== null && tool.borrowedById !== undefined) {
    return 'BORROWED';
  }

  if (tool.status === 'AT_EVENT') {
    const hasRunningEvent = (tool.eventUsages ?? []).some((eu) => {
      const start = new Date(eu.event.startDate);
      const end = new Date(eu.event.endDate);
      return start <= now && now <= end;
    });
    return hasRunningEvent ? 'AT_EVENT' : 'IN_STORAGE';
  }

  return tool.status;
}

module.exports = { deriveToolStatus };
