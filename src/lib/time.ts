import { SGT_TZ } from "./constants";
import { fromZonedTime } from "date-fns-tz";

export function sgtDateAt(date: string, hour: number): Date {
  return fromZonedTime(`${date}T${String(hour).padStart(2, "0")}:00:00`, SGT_TZ);
}
