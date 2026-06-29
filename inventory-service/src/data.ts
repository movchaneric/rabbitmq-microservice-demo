import { Stock } from "./types";

const stock: Stock = {
  prod_01: { name: "Laptop", quantity: 10 },
  prod_02: { name: "Phone", quantity: 5 },
  prod_03: { name: "Headphones", quantity: 0 },
};

let forceFailure = false;

export function getStock(): Stock {
  return stock;
}

export function toggleForceFailure(): boolean {
  forceFailure = !forceFailure;
  return forceFailure;
}

export function shouldFail(): boolean {
  if (forceFailure) return true;
  // return Math.random() < parseFloat(process.env.INVENTORY_FAILURE_RATE ?? '0.3');
  return false;
}
