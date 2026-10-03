import { parseISO } from "date-fns";
import type { FoldEvent, ID } from "../types";

export interface PositionedEvent {
  event: FoldEvent;
  /** 0-based lane within its overlap cluster. */
  lane: number;
  /** Number of lanes in its overlap cluster. */
  lanes: number;
}

/**
 * Assigns side-by-side lanes to overlapping timed events (classic calendar
 * layout). Events in the same transitive-overlap cluster share a lane count.
 */
export function layoutLanes(events: FoldEvent[]): PositionedEvent[] {
  const sorted = [...events].sort(
    (a, b) => a.start_datetime.localeCompare(b.start_datetime) || b.end_datetime.localeCompare(a.end_datetime),
  );
  const result: PositionedEvent[] = [];
  let cluster: PositionedEvent[] = [];
  let laneEnds: number[] = [];
  let clusterEnd = -Infinity;

  const flush = () => {
    const lanes = laneEnds.length;
    cluster.forEach((p) => (p.lanes = lanes));
    result.push(...cluster);
    cluster = [];
    laneEnds = [];
  };

  for (const event of sorted) {
    const start = parseISO(event.start_datetime).getTime();
    const end = parseISO(event.end_datetime).getTime();
    if (start >= clusterEnd && cluster.length) flush();
    let lane = laneEnds.findIndex((laneEnd) => laneEnd <= start);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(end);
    } else {
      laneEnds[lane] = end;
    }
    cluster.push({ event, lane, lanes: 0 });
    clusterEnd = cluster.length === 1 ? end : Math.max(clusterEnd, end);
  }
  if (cluster.length) flush();
  return result;
}

/** Does the event involve any of these people (as participant, passenger or driver)? */
export function involvesAny(event: FoldEvent, ids: Set<ID>): boolean {
  if (ids.size === 0) return true;
  return (
    event.family_members.some((id) => ids.has(id)) ||
    event.passengers.some((id) => ids.has(id)) ||
    (event.driver !== null && ids.has(event.driver))
  );
}
