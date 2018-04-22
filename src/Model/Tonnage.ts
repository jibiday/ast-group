export class Tonnage {
  tonnage: number;
  minimalPrice: number;
  pricePerKm: number;


  constructor(tonnage: number, minimalPrice: number, pricePerKm: number) {
    this.tonnage = tonnage;
    this.minimalPrice = minimalPrice;
    this.pricePerKm = pricePerKm;
  }
}
