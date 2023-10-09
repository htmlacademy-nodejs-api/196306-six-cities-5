import { AmenityType, City, Coordinates, HousingType } from '../../../types/index.js';

export class CreateOfferDto {
  public title: string;
  public description: string;
  public postDate: Date;
  public city: City;
  public imagePreview: string;
  public images: string[];
  public isPremium: boolean;
  public isFavorite: boolean;
  public rating: number;
  public housingType: HousingType;
  public roomAmount: number;
  public guestAmount: number;
  public price: number;
  public amenities: AmenityType[];
  public commentAmount: number;
  public location: Coordinates;
  public authorId: string;
}