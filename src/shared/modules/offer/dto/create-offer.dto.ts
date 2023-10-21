import { AmenityType, City, HousingType } from '../../../types/index.js';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsMongoId,
  Max,
  MaxLength,
  Min,
  MinLength,
  IsBoolean,
  ValidateNested,
} from 'class-validator';
import { CreateOfferValidationMessage } from './create-offer.messages.js';
import { CoordinatesDto } from './coordinates.dto.js';

export class CreateOfferDto {
  @MinLength(10, { message: CreateOfferValidationMessage.title.minLength })
  @MaxLength(100, { message: CreateOfferValidationMessage.title.maxLength })
  public title: string;

  @MinLength(20, { message: CreateOfferValidationMessage.description.minLength })
  @MaxLength(1024, { message: CreateOfferValidationMessage.description.maxLength })
  public description: string;

  @IsDateString({}, { message: CreateOfferValidationMessage.postDate.invalidFormat })
  public postDate: Date;

  @IsEnum(City, { message: CreateOfferValidationMessage.city.invalid })
  public city: City;

  @MaxLength(256, { message: CreateOfferValidationMessage.image.maxLength })
  public imagePreview: string;

  @IsArray({ message: CreateOfferValidationMessage.images.invalidFormat })
  @MaxLength(256, { message: CreateOfferValidationMessage.images.maxLength })
  @ArrayMinSize(6, { message: CreateOfferValidationMessage.images.invalidSize })
  @ArrayMaxSize(6, { message: CreateOfferValidationMessage.images.invalidSize })
  public images: string[];

  @IsBoolean({ message: CreateOfferValidationMessage.premium.invalidFormat })
  public isPremium: boolean;

  @IsEnum(HousingType, { message: CreateOfferValidationMessage.housingType.invalid })
  public housingType: HousingType;

  @IsInt({ message: CreateOfferValidationMessage.rooms.invalidFormat })
  @Min(1, { message: CreateOfferValidationMessage.rooms.minValue })
  @Max(8, { message: CreateOfferValidationMessage.rooms.maxValue })
  public roomAmount: number;

  @IsInt({ message: CreateOfferValidationMessage.guests.invalidFormat })
  @Min(1, { message: CreateOfferValidationMessage.guests.minValue })
  @Max(10, { message: CreateOfferValidationMessage.guests.maxValue })
  public guestAmount: number;

  @IsInt({ message: CreateOfferValidationMessage.price.invalidFormat })
  @Min(100, { message: CreateOfferValidationMessage.price.minValue })
  @Max(100000, { message: CreateOfferValidationMessage.price.maxValue })
  public price: number;

  @IsArray({ message: CreateOfferValidationMessage.amenities.invalidFormat })
  @IsEnum(AmenityType, { each: true, message: CreateOfferValidationMessage.amenities.invalid })
  public amenities: AmenityType[];

  @ValidateNested()
  public location: CoordinatesDto;

  @IsMongoId({ message: CreateOfferValidationMessage.authorId.invalidId })
  public authorId: string;
}
