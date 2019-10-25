import { Event } from "./types";

export function getEventPredicate(eventMatcher: EventMatcher) {
  let predicate: (item: Event) => boolean;

  if (eventMatcher instanceof RegExp) {
    predicate = ({ event }: Event) => eventMatcher.test(event.type);
  } else if (eventMatcher instanceof Function) {
    predicate = eventMatcher;
  } else if (typeof eventMatcher === "boolean") {
    predicate = () => eventMatcher;
  } else if (eventMatcher.constructor === Array) {
    predicate = ({ event }: Event) => eventMatcher.includes(event.type);
  } else {
    predicate = ({ event }: Event) => eventMatcher === event.type;
  }
  return predicate;
}
