import { Command } from './command.interface.js';
import { TSVFileReader } from '../../shared/libs/file-reader/index.js';
import { createOffer, getMongoURI } from '../../shared/helpers/index.js';
import { DefaultUserService, UserModel, UserService } from '../../shared/modules/user/index.js';
import { DefaultOfferService, OfferModel, OfferService } from '../../shared/modules/offer/index.js';
import { DatabaseClient, MongoDatabaseClient } from '../../shared/libs/database-client/index.js';
import { ConsoleLogger, Logger } from '../../shared/libs/logger/index.js';
import { Offer } from '../../shared/types/index.js';
import {
  CONNECTION_RETRY_TIMEOUT,
  DEFAULT_DB_PORT,
  DEFAULT_USER_PASSWORD, LOGS,
  MAX_CONNECTION_RETRIES
} from './command.constant.js';

export class ImportCommand implements Command {
  private readonly userService: UserService;
  private readonly offerService: OfferService;
  private readonly databaseClient: DatabaseClient;
  private readonly logger: Logger;
  private salt: string;

  constructor() {
    this.onImportedLine = this.onImportedLine.bind(this);
    this.onCompleteImport = this.onCompleteImport.bind(this);

    this.logger = new ConsoleLogger();
    this.offerService = new DefaultOfferService(this.logger, OfferModel);
    this.userService = new DefaultUserService(this.logger, UserModel);
    this.databaseClient = new MongoDatabaseClient(this.logger);
  }

  public getName(): string {
    return '--import';
  }

  private async onImportedLine(line: string, resolve: () => void) {
    const offer = createOffer(line);
    await this.saveOffer(offer);
    resolve();
  }

  private onCompleteImport(count: number) {
    this.logger.info(`${count} rows imported.`);
    this.databaseClient.disconnect();
  }

  private async saveOffer(offer: Offer) {
    const user = await this.userService.findOrCreate(
      {
        ...offer.author,
        password: DEFAULT_USER_PASSWORD
      },
      this.salt
    );

    await this.offerService.create({
      authorId: user.id,
      title: offer.title,
      description: offer.description,
      postDate: offer.postDate,
      city: offer.city,
      images: offer.images,
      isPremium: offer.isPremium,
      housingType: offer.housingType,
      roomAmount: offer.roomAmount,
      guestAmount: offer.guestAmount,
      price: offer.price,
      amenities: offer.amenities,
      location: offer.location
    });
  }

  public async run(...parameters: string[]): Promise<void> {
    const [filename, login, password, host, dbname, salt] = parameters;

    if (!filename) {
      this.logger.warn(LOGS.MISSING_PARAM.replace('{param}', 'filename'));
      return;
    }

    if (!login) {
      this.logger.warn(LOGS.MISSING_PARAM.replace('{param}', 'login'));
      return;
    }

    if (!password) {
      this.logger.warn(LOGS.MISSING_PARAM.replace('{param}', 'password'));
      return;
    }

    if (!host) {
      this.logger.warn(LOGS.MISSING_PARAM.replace('{param}', 'host'));
      return;
    }

    if (!dbname) {
      this.logger.warn(LOGS.MISSING_PARAM.replace('{param}', 'dbname'));
      return;
    }

    if (!salt) {
      this.logger.warn(LOGS.MISSING_PARAM.replace('{param}', 'salt'));
      return;
    }

    const uri = getMongoURI(login, password, host, DEFAULT_DB_PORT, dbname);
    this.salt = salt;

    await this.databaseClient.connect(uri, MAX_CONNECTION_RETRIES, CONNECTION_RETRY_TIMEOUT);

    const fileReader = new TSVFileReader(filename.trim());

    fileReader.on('line', this.onImportedLine);
    fileReader.on('end', this.onCompleteImport);

    try {
      await fileReader.read();
    } catch (error) {
      this.logger.error(
        `Can't import data from file: ${filename}`,
        error as Error
      );
    }
  }
}

export default ImportCommand;
