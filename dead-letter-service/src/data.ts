import { DeadLetter } from './types';

const deadLetters: DeadLetter[] = [];

export function addDeadLetter(entry: DeadLetter): void {
  deadLetters.push(entry);
}

export function getDeadLetters(): DeadLetter[] {
  return deadLetters;
}
