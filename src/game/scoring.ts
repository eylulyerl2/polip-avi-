import { SCORE, type ObjectKind } from "./config";

/** Points for tapping an object of this kind. */
export function tapPoints(kind: ObjectKind): number {
  return SCORE[kind].tap;
}

/** Points for letting an object of this kind leave the screen untouched. */
export function missPoints(kind: ObjectKind): number {
  return SCORE[kind].miss;
}
